import {
  decodeEventLog,
  type Hex,
  type Log,
  type TransactionReceipt,
} from 'viem'
import { hardhat, localhost, sepolia } from 'viem/chains'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import {
  getChainId,
  getElectionFactoryAddress,
  getExplorerTxUrl,
} from '@/features/voto/crypto/constants'
import { ELECTION_FACTORY_ABI } from '@/features/voto/crypto/election-factory-abi'
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
  electionFactoryAddress?: Hex
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

/**
 * VOTAR-439: cada comicio despliega su propio BallotContract vía
 * ElectionFactory, por lo que el electionId se decodifica del evento ANTES
 * de validar la dirección del contrato — comparar contra una única dirección
 * fija de BallotContract rechazaba con "no encontrado" cualquier voto de un
 * comicio distinto al que esa constante apuntaba.
 */
const findSignedVoteCast = (
  logs: readonly Log[]
): { electionId: number; ballotAddress: Hex } | null => {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: BALLOT_CONTRACT_ABI,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName !== 'SignedVoteCast') continue
      const electionId = Number(decoded.args.electionId)
      if (!Number.isFinite(electionId) || electionId <= 0) continue
      return { electionId, ballotAddress: log.address as Hex }
    } catch {
      // Log is not SignedVoteCast — skip without exposing raw payload.
    }
  }

  return null
}

const resolveElectionBallotAddress = async (
  publicClient: VotePublicClient,
  electionFactoryAddress: Hex,
  electionId: number
): Promise<Hex> => {
  const deployment = await publicClient.readContract({
    address: electionFactoryAddress,
    abi: ELECTION_FACTORY_ABI,
    functionName: 'getElection',
    args: [BigInt(electionId)],
  })

  if (!deployment.exists) {
    throw new VoteInclusionNotFoundError()
  }

  return deployment.ballot
}

const assertSuccessfulVoteReceipt = async (
  receipt: TransactionReceipt | null,
  publicClient: VotePublicClient,
  electionFactoryAddress: Hex
): Promise<{
  electionId: number
  blockNumber: number
  txHash: Hex
  ballotAddress: Hex
}> => {
  if (!receipt) {
    throw new VoteInclusionNotFoundError()
  }

  if (receipt.status !== 'success') {
    throw new VoteInclusionNotFoundError()
  }

  const voteEvent = findSignedVoteCast(receipt.logs)
  if (!voteEvent) {
    throw new VoteInclusionNotFoundError()
  }

  let expectedBallotAddress: Hex
  try {
    expectedBallotAddress = await resolveElectionBallotAddress(
      publicClient,
      electionFactoryAddress,
      voteEvent.electionId
    )
  } catch (error) {
    if (error instanceof VoteInclusionNotFoundError) throw error
    throw new VoteInclusionNotFoundError()
  }

  if (
    voteEvent.ballotAddress.toLowerCase() !==
    expectedBallotAddress.toLowerCase()
  ) {
    throw new VoteInclusionNotFoundError()
  }

  return {
    electionId: voteEvent.electionId,
    blockNumber: Number(receipt.blockNumber),
    txHash: receipt.transactionHash,
    ballotAddress: expectedBallotAddress,
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
  const electionFactoryAddress =
    options.electionFactoryAddress ?? getElectionFactoryAddress()
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

  const parsed = await assertSuccessfulVoteReceipt(
    receipt,
    publicClient,
    electionFactoryAddress
  )

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
    contractAddress: parsed.ballotAddress,
    explorerUrl: getExplorerTxUrl(parsed.txHash, chainId),
    networkName,
    mensaje: buildInclusionSuccessMessage(parsed.blockNumber, networkName),
  }

  return result
}
