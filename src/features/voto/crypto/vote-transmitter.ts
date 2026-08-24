import type { Hex } from 'viem'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import {
  getBallotContractAddress,
  VOTE_TX_CONFIRMATION_TIMEOUT_MS,
  VOTE_TX_GAS_MARGIN,
  VOTE_TX_MAX_ATTEMPTS,
} from '@/features/voto/crypto/constants'
import {
  createVotePublicClient,
  createVoteTransmitterWalletClient,
  type VotePublicClient,
  type VoteWalletClient,
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
  merkleProof: readonly Hex[]
}

export type TransmitSignedVoteResult = {
  txHash: Hex
  blockNumber: bigint
}

export type TransmitProgressPhase = 'estimating' | 'sending' | 'confirming'

export type TransmitSignedVoteOptions = {
  publicClient?: VotePublicClient
  walletClient?: VoteWalletClient
  contractAddress?: Hex
  gasMargin?: number
  maxAttempts?: number
  confirmationTimeoutMs?: number
  onProgress?: (phase: TransmitProgressPhase) => void
  /** VOTAR-445: fired as soon as writeContract returns, before receipt wait. */
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

const toProofBytes32 = (proof: readonly string[]): Hex[] =>
  proof.map((sibling) => toBytes32(sibling))

const applyGasMargin = (estimate: bigint, margin: number): bigint => {
  if (estimate <= 0n || !Number.isFinite(margin) || margin <= 0) {
    throw new Error('Invalid gas estimate')
  }
  const percent = BigInt(Math.round(margin * 100))
  // Integer ceil: (estimate * percent + 99) / 100
  return (estimate * percent + 99n) / 100n
}

const buildCastArgs = (input: TransmitSignedVoteInput) => {
  const { signed } = input
  return [
    BigInt(signed.electionId),
    toBytes32(input.voterLeaf),
    toProofBytes32(input.merkleProof),
    signed.nullifier,
    signed.selectionHash,
    BigInt(signed.timestamp),
    signed.expectedSigner,
    signed.signature,
    signed.candidateId,
  ] as const
}

/**
 * Assembles and broadcasts castSignedVote with gas margin, retries and receipt wait.
 * Gas is paid by the platform transmitter wallet (VOTAR-358).
 */
export const transmitSignedVote = async (
  input: TransmitSignedVoteInput,
  options: TransmitSignedVoteOptions = {}
): Promise<TransmitSignedVoteResult> => {
  const publicClient = options.publicClient ?? createVotePublicClient()
  const walletClient =
    options.walletClient ?? createVoteTransmitterWalletClient()
  const contractAddress = options.contractAddress ?? getBallotContractAddress()
  const gasMargin = options.gasMargin ?? VOTE_TX_GAS_MARGIN
  const maxAttempts = options.maxAttempts ?? VOTE_TX_MAX_ATTEMPTS
  const confirmationTimeoutMs =
    options.confirmationTimeoutMs ?? VOTE_TX_CONFIRMATION_TIMEOUT_MS
  const args = buildCastArgs(input)
  const account = walletClient.account
  if (!account) {
    throw mapVoteTxError(
      new Error('Vote transmitter wallet client has no account')
    )
  }

  let lastError: VoteTxError | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      options.onProgress?.('estimating')
      const gasEstimate = await publicClient.estimateContractGas({
        address: contractAddress,
        abi: BALLOT_CONTRACT_ABI,
        functionName: 'castSignedVote',
        args,
        account,
      })
      const gas = applyGasMargin(gasEstimate, gasMargin)

      options.onProgress?.('sending')
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: BALLOT_CONTRACT_ABI,
        functionName: 'castSignedVote',
        args,
        account,
        chain: walletClient.chain,
        gas,
      })
      options.onTxHash?.(txHash)

      options.onProgress?.('confirming')
      return await waitForVoteTxReceipt(txHash, {
        publicClient,
        confirmationTimeoutMs,
      })
    } catch (error) {
      const mapped = mapVoteTxError(error)
      lastError = mapped
      const canRetry =
        mapped.isTransient && attempt < maxAttempts && mapped.canRetrySend
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

export { applyGasMargin, isTransientVoteTxError, toBytes32 }
