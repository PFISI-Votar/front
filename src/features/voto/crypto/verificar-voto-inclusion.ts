import {
  decodeEventLog,
  type Hex,
  type Log,
  type TransactionReceipt,
} from 'viem'
import { hardhat, localhost, sepolia } from 'viem/chains'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import {
  getBallotContractAddress,
  getChainId,
  getExplorerTxUrl,
} from '@/features/voto/crypto/constants'
import {
  createVotePublicClient,
  type VotePublicClient,
} from '@/features/voto/crypto/rpc-client'
import { TX_HASH_REGEX } from '@/features/voto/lib/recibo-canonical'

/**
 * VOTAR-366: local E2E vote inclusion verifier.
 * Queries the chain directly (no backend) and never surfaces selectionHash,
 * nullifier, voterLeaf or candidate identifiers.
 */

export const VOTO_NO_ENCONTRADO_MENSAJE =
  'El registro de sufragio no pudo ser encontrado en el sistema. Verifique el identificador ingresado.'

export class VoteInclusionNotFoundError extends Error {
  constructor(message = VOTO_NO_ENCONTRADO_MENSAJE) {
    super(message)
    this.name = 'VoteInclusionNotFoundError'
  }
}

export class VoteInclusionInvalidHashError extends Error {
  constructor(
    message = 'El hash debe ser un TransactionHash Ethereum válido (0x + 64 caracteres hex).'
  ) {
    super(message)
    this.name = 'VoteInclusionInvalidHashError'
  }
}

export type VoteInclusionResult = {
  confirmado: true
  idEleccion: number
  txHash: Hex
  blockNumber: number
  timestamp: string
  contractAddress: Hex
  explorerUrl: string | null
  networkName: string
  mensaje: string
}

export type VerificarInclusionVotoOptions = {
  publicClient?: VotePublicClient
  ballotAddress?: Hex
  chainId?: number
}

export const getBlockchainNetworkName = (chainId = getChainId()): string => {
  if (chainId === sepolia.id) return 'Sepolia'
  if (chainId === hardhat.id || chainId === localhost.id) return 'local'
  return `cadena ${chainId}`
}

export const buildInclusionSuccessMessage = (
  blockNumber: number,
  networkName = getBlockchainNetworkName()
): string =>
  `Su voto ha sido incluido con éxito en el bloque número ${blockNumber} de la blockchain de ${networkName}`

const findSignedVoteCast = (
  logs: readonly Log[],
  ballotAddress: Hex
): { electionId: number } | null => {
  const normalizedBallot = ballotAddress.toLowerCase()

  for (const log of logs) {
    if (log.address.toLowerCase() !== normalizedBallot) continue
    try {
      const decoded = decodeEventLog({
        abi: BALLOT_CONTRACT_ABI,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName !== 'SignedVoteCast') continue
      const electionId = Number(decoded.args.electionId)
      if (!Number.isFinite(electionId) || electionId <= 0) continue
      return { electionId }
    } catch {
      // Log is not SignedVoteCast — skip without exposing raw payload.
    }
  }

  return null
}

const assertSuccessfulVoteReceipt = (
  receipt: TransactionReceipt | null,
  ballotAddress: Hex
): { electionId: number; blockNumber: number; txHash: Hex } => {
  if (!receipt) {
    throw new VoteInclusionNotFoundError()
  }

  if (receipt.status !== 'success') {
    throw new VoteInclusionNotFoundError()
  }

  const toAddress = receipt.to?.toLowerCase()
  if (!toAddress || toAddress !== ballotAddress.toLowerCase()) {
    throw new VoteInclusionNotFoundError()
  }

  const voteEvent = findSignedVoteCast(receipt.logs, ballotAddress)
  if (!voteEvent) {
    throw new VoteInclusionNotFoundError()
  }

  return {
    electionId: voteEvent.electionId,
    blockNumber: Number(receipt.blockNumber),
    txHash: receipt.transactionHash,
  }
}

/**
 * Confirms cryptographic inclusion of a vote receipt hash via direct RPC.
 * Privacy invariant: result never includes candidate/selection/nullifier fields.
 */
export async function verificarInclusionVotoLocal(
  txHash: string,
  options: VerificarInclusionVotoOptions = {}
): Promise<VoteInclusionResult> {
  const trimmed = txHash.trim()
  if (!TX_HASH_REGEX.test(trimmed)) {
    throw new VoteInclusionInvalidHashError()
  }

  const normalizedTxHash = trimmed.toLowerCase() as Hex
  const chainId = options.chainId ?? getChainId()
  const ballotAddress = options.ballotAddress ?? getBallotContractAddress()
  const publicClient = options.publicClient ?? createVotePublicClient()
  const networkName = getBlockchainNetworkName(chainId)

  let receipt: TransactionReceipt | null
  try {
    receipt = await publicClient.getTransactionReceipt({
      hash: normalizedTxHash,
    })
  } catch {
    throw new VoteInclusionNotFoundError()
  }

  const parsed = assertSuccessfulVoteReceipt(receipt, ballotAddress)

  let timestamp = new Date().toISOString()
  try {
    const block = await publicClient.getBlock({
      blockNumber: BigInt(parsed.blockNumber),
    })
    if (block?.timestamp != null) {
      timestamp = new Date(Number(block.timestamp) * 1000).toISOString()
    }
  } catch {
    // Block timestamp is auxiliary; inclusion is already proven by the receipt.
  }

  const result: VoteInclusionResult = {
    confirmado: true,
    idEleccion: parsed.electionId,
    txHash: parsed.txHash.toLowerCase() as Hex,
    blockNumber: parsed.blockNumber,
    timestamp,
    contractAddress: ballotAddress,
    explorerUrl: getExplorerTxUrl(parsed.txHash, chainId),
    networkName,
    mensaje: buildInclusionSuccessMessage(parsed.blockNumber, networkName),
  }

  return result
}
