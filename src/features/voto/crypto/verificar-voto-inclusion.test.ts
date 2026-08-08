import {
  encodeEventTopics,
  encodeAbiParameters,
  type Hex,
  type Log,
} from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import {
  buildInclusionSuccessMessage,
  getBlockchainNetworkName,
  verificarInclusionVotoLocal,
  VoteInclusionInvalidHashError,
  VoteInclusionNotFoundError,
  VOTO_NO_ENCONTRADO_MENSAJE,
} from '@/features/voto/crypto/verificar-voto-inclusion'

const BALLOT = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Hex
const OTHER_BALLOT = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199' as Hex
const ELECTION_FACTORY = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Hex
const TX_HASH = `0x${'ab'.repeat(32)}` as Hex

const buildSignedVoteCastLog = (
  electionId: number,
  ballotAddress: Hex = BALLOT
): Log => {
  const encodedTopics = encodeEventTopics({
    abi: BALLOT_CONTRACT_ABI,
    eventName: 'SignedVoteCast',
    args: {
      electionId: BigInt(electionId),
      nullifier: `0x${'22'.repeat(32)}`,
    },
  }).filter((topic): topic is Hex => typeof topic === 'string')

  const topics = encodedTopics as [`0x${string}`, ...`0x${string}`[]]

  const data = encodeAbiParameters(
    [
      { name: 'selectionHash', type: 'bytes32' },
      { name: 'signer', type: 'address' },
    ],
    [`0x${'33'.repeat(32)}`, '0x00000000000000000000000000000000000000aa']
  )

  return {
    address: ballotAddress,
    topics,
    data,
    blockHash: `0x${'44'.repeat(32)}`,
    blockNumber: 4582193n,
    logIndex: 0,
    transactionHash: TX_HASH,
    transactionIndex: 0,
    removed: false,
  }
}

const buildElectionDeployment = (ballot: Hex, exists = true) => ({
  ballot,
  voteRegistry: '0x0000000000000000000000000000000000000003' as Hex,
  auditView: '0x0000000000000000000000000000000000000004' as Hex,
  revoteConfig: {
    enabled: false,
    maxVotesPerVoter: 1,
    minIntervalSeconds: 0,
    policy: 0,
  },
  exists,
})

describe('verificarInclusionVotoLocal — VOTAR-366', () => {
  it('getBlockchainNetworkName mapea Sepolia y local', () => {
    expect(getBlockchainNetworkName(11_155_111)).toBe('Sepolia')
    expect(getBlockchainNetworkName(31_337)).toBe('local')
    expect(getBlockchainNetworkName(1)).toBe('cadena 1')
  })

  it('buildInclusionSuccessMessage sigue el texto UAT-01', () => {
    expect(buildInclusionSuccessMessage(4582193, 'Sepolia')).toBe(
      'Su voto ha sido incluido con éxito en el bloque número 4582193 de la blockchain de Sepolia'
    )
  })

  it('UAT-01: confirma inclusión on-chain sin revelar el voto', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: TX_HASH,
        status: 'success',
        to: BALLOT,
        blockNumber: 4582193n,
        logs: [buildSignedVoteCastLog(7)],
      }),
      getBlock: vi.fn().mockResolvedValue({ timestamp: 1720708200n }),
      readContract: vi.fn().mockResolvedValue(buildElectionDeployment(BALLOT)),
    }

    const result = await verificarInclusionVotoLocal(TX_HASH, {
      publicClient: publicClient as never,
      electionFactoryAddress: ELECTION_FACTORY,
      chainId: 11_155_111,
    })

    expect(result.confirmado).toBe(true)
    expect(result.blockNumber).toBe(4582193)
    expect(result.idEleccion).toBe(7)
    expect(result.mensaje).toBe(
      'Su voto ha sido incluido con éxito en el bloque número 4582193 de la blockchain de Sepolia'
    )
    expect(result.explorerUrl).toContain(TX_HASH)
    expect(result).not.toHaveProperty('selectionHash')
    expect(result).not.toHaveProperty('nullifier')
    expect(result).not.toHaveProperty('voterLeaf')
    expect(result).not.toHaveProperty('candidateId')
    expect(JSON.stringify(result)).not.toMatch(/candidato|lista|selection/i)
    expect(publicClient.getTransactionReceipt).toHaveBeenCalledWith({
      hash: TX_HASH,
    })
  })

  it('VOTAR-439: confirma inclusión de un comicio cuyo BallotContract difiere de otros comicios', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: TX_HASH,
        status: 'success',
        to: OTHER_BALLOT,
        blockNumber: 4582193n,
        logs: [buildSignedVoteCastLog(9, OTHER_BALLOT)],
      }),
      getBlock: vi.fn().mockResolvedValue({ timestamp: 1720708200n }),
      readContract: vi
        .fn()
        .mockResolvedValue(buildElectionDeployment(OTHER_BALLOT)),
    }

    const result = await verificarInclusionVotoLocal(TX_HASH, {
      publicClient: publicClient as never,
      electionFactoryAddress: ELECTION_FACTORY,
      chainId: 11_155_111,
    })

    expect(result.idEleccion).toBe(9)
    expect(result.contractAddress).toBe(OTHER_BALLOT)
  })

  it('UAT-02: rechaza recibos inexistentes o manipulados', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(null),
      getBlock: vi.fn(),
      readContract: vi.fn(),
    }

    await expect(
      verificarInclusionVotoLocal(TX_HASH, {
        publicClient: publicClient as never,
        electionFactoryAddress: ELECTION_FACTORY,
        chainId: 11_155_111,
      })
    ).rejects.toBeInstanceOf(VoteInclusionNotFoundError)

    await expect(
      verificarInclusionVotoLocal(TX_HASH, {
        publicClient: publicClient as never,
        electionFactoryAddress: ELECTION_FACTORY,
      })
    ).rejects.toThrow(VOTO_NO_ENCONTRADO_MENSAJE)
  })

  it('UAT-02: rechaza transacciones sin SignedVoteCast', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: TX_HASH,
        status: 'success',
        to: BALLOT,
        blockNumber: 10n,
        logs: [],
      }),
      getBlock: vi.fn(),
      readContract: vi.fn(),
    }

    await expect(
      verificarInclusionVotoLocal(TX_HASH, {
        publicClient: publicClient as never,
        electionFactoryAddress: ELECTION_FACTORY,
      })
    ).rejects.toBeInstanceOf(VoteInclusionNotFoundError)
  })

  it('UAT-02: rechaza el evento si su dirección no coincide con el BallotContract resuelto por ElectionFactory', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: TX_HASH,
        status: 'success',
        to: OTHER_BALLOT,
        blockNumber: 4582193n,
        logs: [buildSignedVoteCastLog(7, OTHER_BALLOT)],
      }),
      getBlock: vi.fn(),
      readContract: vi.fn().mockResolvedValue(buildElectionDeployment(BALLOT)),
    }

    await expect(
      verificarInclusionVotoLocal(TX_HASH, {
        publicClient: publicClient as never,
        electionFactoryAddress: ELECTION_FACTORY,
      })
    ).rejects.toBeInstanceOf(VoteInclusionNotFoundError)
  })

  it('UAT-02: rechaza comicios que ElectionFactory no reconoce como desplegados', async () => {
    const publicClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: TX_HASH,
        status: 'success',
        to: BALLOT,
        blockNumber: 4582193n,
        logs: [buildSignedVoteCastLog(7)],
      }),
      getBlock: vi.fn(),
      readContract: vi
        .fn()
        .mockResolvedValue(buildElectionDeployment(BALLOT, false)),
    }

    await expect(
      verificarInclusionVotoLocal(TX_HASH, {
        publicClient: publicClient as never,
        electionFactoryAddress: ELECTION_FACTORY,
      })
    ).rejects.toBeInstanceOf(VoteInclusionNotFoundError)
  })

  it('rechaza TransactionHash con formato inválido', async () => {
    await expect(verificarInclusionVotoLocal('0x1234')).rejects.toBeInstanceOf(
      VoteInclusionInvalidHashError
    )
  })
})
