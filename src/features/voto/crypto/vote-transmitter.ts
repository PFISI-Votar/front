import type { Hex } from 'viem'
import {
  postRelayerCast,
  solicitarAutorizacionRelayer,
  type RelayCastBody,
} from '@/features/voto/api/voto-api'
import {
  VOTE_TX_CONFIRMATION_TIMEOUT_MS,
  VOTE_TX_MAX_ATTEMPTS,
} from '@/features/voto/crypto/constants'
import {
  createVotePublicClient,
  type VotePublicClient,
} from '@/features/voto/crypto/rpc-client'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'
import {
  isTransientVoteTxError,
  mapVoteTxError,
  type VoteTxError,
} from '@/features/voto/crypto/vote-tx-errors'

export type TransmitSignedVoteInput = {
  signed: SignedVotePayload
  voterLeaf: Hex
  /** Kept for callers that still fetch the proof; not sent in the cast body. */
  merkleProof: readonly Hex[]
  /** VOTAR-377 — institutional signature from the Entidad de Firmas Digitales. */
  validatorSignature: Hex
}

export type TransmitSignedVoteResult = {
  txHash: Hex
  blockNumber: bigint
}

export type TransmitProgressPhase = 'estimating' | 'sending' | 'confirming'

export type RelayCastFn = (
  input: TransmitSignedVoteInput
) => Promise<{ txHash: Hex }>

export type TransmitSignedVoteOptions = {
  publicClient?: VotePublicClient
  /**
   * VOTAR-497 — el gas lo paga el relayer del backend. El override existe para
   * tests; el default pide una capacidad autenticada y hace POST sin cookies.
   */
  relayCast?: RelayCastFn
  maxAttempts?: number
  confirmationTimeoutMs?: number
  onProgress?: (phase: TransmitProgressPhase) => void
  /** VOTAR-445: fired as soon as the relayer returns the hash, before receipt wait. */
  onTxHash?: (txHash: Hex) => void
}

export type WaitForVoteTxReceiptOptions = {
  publicClient?: VotePublicClient
  confirmationTimeoutMs?: number
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const toBytes32 = (value: string): Hex => {
  const normalized = value.startsWith('0x') ? value : `0x${value}`
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('voterLeaf must be a 32-byte hex value (hashHoja)')
  }
  return normalized.toLowerCase() as Hex
}

export const buildRelayerCastBody = (
  input: TransmitSignedVoteInput,
  relayToken: string
): RelayCastBody => ({
  voterLeaf: toBytes32(input.voterLeaf),
  nullifier: toBytes32(input.signed.nullifier),
  selectionHash: toBytes32(input.signed.selectionHash),
  candidateIds: input.signed.candidateIds.map((id) => id.toString()),
  timestamp: String(input.signed.timestamp),
  expectedSigner: input.signed.expectedSigner,
  signature: input.signed.signature,
  validatorSignature: input.validatorSignature,
  relayToken,
})

const createDefaultRelayCast = (): RelayCastFn => {
  let relayToken: string | null = null
  return async (input) => {
    if (!relayToken) {
      const auth = await solicitarAutorizacionRelayer(input.signed.electionId)
      relayToken = auth.relayToken
    }
    return await postRelayerCast(
      input.signed.electionId,
      buildRelayerCastBody(input, relayToken)
    )
  }
}

/**
 * Pide al relayer del backend que transmita castSignedVote y espera el recibo.
 * La clave de gas no sale del servidor (VOTAR-497).
 */
export const transmitSignedVote = async (
  input: TransmitSignedVoteInput,
  options: TransmitSignedVoteOptions = {}
): Promise<TransmitSignedVoteResult> => {
  const publicClient = options.publicClient ?? createVotePublicClient()
  const relayCast = options.relayCast ?? createDefaultRelayCast()
  const maxAttempts = options.maxAttempts ?? VOTE_TX_MAX_ATTEMPTS
  const confirmationTimeoutMs =
    options.confirmationTimeoutMs ?? VOTE_TX_CONFIRMATION_TIMEOUT_MS

  let lastError: VoteTxError | null = null
  let sentHash: Hex | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (!sentHash) {
        options.onProgress?.('sending')
        const relayed = await relayCast(input)
        sentHash = relayed.txHash
        options.onTxHash?.(sentHash)
      }

      options.onProgress?.('confirming')
      return await waitForVoteTxReceipt(sentHash, {
        publicClient,
        confirmationTimeoutMs,
      })
    } catch (error) {
      const mapped = mapVoteTxError(error)
      lastError = mapped
      // After broadcast: retry receipt wait only (never re-cast / waste gas).
      // Before broadcast: only transient send failures may retry relayCast.
      const canRetry = sentHash
        ? mapped.canRetrySend && attempt < maxAttempts
        : mapped.isTransient && attempt < maxAttempts && mapped.canRetrySend
      if (!canRetry) {
        throw mapped
      }
      await sleep(400 * attempt)
    }
  }

  throw (
    lastError ??
    mapVoteTxError(new Error('Vote transmission failed after retries'))
  )
}

/**
 * VOTAR-445 — Resume waiting for a cast that was already broadcast (e.g. after F5).
 */
export const waitForVoteTxReceipt = async (
  txHash: Hex,
  options: WaitForVoteTxReceiptOptions = {}
): Promise<TransmitSignedVoteResult> => {
  const publicClient = options.publicClient ?? createVotePublicClient()
  const confirmationTimeoutMs =
    options.confirmationTimeoutMs ?? VOTE_TX_CONFIRMATION_TIMEOUT_MS

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: confirmationTimeoutMs,
  })

  if (receipt.status === 'reverted') {
    throw mapVoteTxError(
      new Error('Transaction reverted while waiting for confirmation')
    )
  }

  return {
    txHash,
    blockNumber: receipt.blockNumber,
  }
}

export { isTransientVoteTxError, toBytes32 }
