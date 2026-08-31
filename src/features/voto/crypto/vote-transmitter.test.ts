import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'
import {
  applyGasMargin,
  transmitSignedVote,
  waitForVoteTxReceipt,
  type TransmitSignedVoteInput,
} from '@/features/voto/crypto/vote-transmitter'
import type { VoteTxError } from '@/features/voto/crypto/vote-tx-errors'

const signed: SignedVotePayload = {
  electionId: 7,
  nullifier:
    '0x1111111111111111111111111111111111111111111111111111111111111111',
  selectionHash:
    '0x2222222222222222222222222222222222222222222222222222222222222222',
  candidateIds: [101n],
  timestamp: 1_700_000_000,
  expectedSigner: '0x00000000000000000000000000000000000000aa',
  signature: `0x${'ab'.repeat(65)}`,
}

const input: TransmitSignedVoteInput = {
  signed,
  voterLeaf:
    '0x3333333333333333333333333333333333333333333333333333333333333333',
  merkleProof: [
    '0x4444444444444444444444444444444444444444444444444444444444444444',
  ],
}

describe('vote-transmitter — VOTAR-358', () => {
  const estimateContractGas = vi.fn()
  const writeContract = vi.fn()
  const waitForTransactionReceipt = vi.fn()
  const onProgress = vi.fn()

  const publicClient = {
    estimateContractGas,
    waitForTransactionReceipt,
  }

  const walletClient = {
    account: { address: '0x00000000000000000000000000000000000000bb' },
    chain: { id: 31_337 },
    writeContract,
  }

  beforeEach(() => {
    estimateContractGas.mockReset()
    writeContract.mockReset()
    waitForTransactionReceipt.mockReset()
    onProgress.mockReset()
  })

  it('UAT-01: estimates gas with +10% margin, sends and returns tx hash', async () => {
    estimateContractGas.mockResolvedValue(100_000n)
    writeContract.mockResolvedValue('0x' + 'f'.repeat(64))
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 42n,
    })
    const onTxHash = vi.fn()

    const result = await transmitSignedVote(input, {
      publicClient: publicClient as never,
      walletClient: walletClient as never,
      contractAddress: '0x0000000000000000000000000000000000000001',
      onProgress,
      onTxHash,
    })

    expect(estimateContractGas).toHaveBeenCalledOnce()
    const estimateArgs = estimateContractGas.mock.calls[0]?.[0] as {
      args: unknown[]
    }
    expect(estimateArgs.args[estimateArgs.args.length - 1]).toEqual([101n])
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        gas: 110_000n,
      })
    )
    const writeArgs = writeContract.mock.calls[0]?.[0] as { args: unknown[] }
    expect(writeArgs.args[writeArgs.args.length - 1]).toEqual([101n])
    expect(result.txHash).toBe('0x' + 'f'.repeat(64))
    expect(result.blockNumber).toBe(42n)
    expect(onTxHash).toHaveBeenCalledWith('0x' + 'f'.repeat(64))
    expect(onProgress.mock.calls.map((call) => call[0])).toEqual([
      'estimating',
      'sending',
      'confirming',
    ])
  })

  it('VOTAR-445: waitForVoteTxReceipt resumes a broadcast cast', async () => {
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 77n,
    })

    const result = await waitForVoteTxReceipt(
      ('0x' + 'a'.repeat(64)) as never,
      {
        publicClient: publicClient as never,
      }
    )

    expect(result).toEqual({
      txHash: '0x' + 'a'.repeat(64),
      blockNumber: 77n,
    })
    expect(waitForTransactionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ hash: '0x' + 'a'.repeat(64) })
    )
  })

  it('UAT-02: retries transient network errors up to 3 attempts', async () => {
    estimateContractGas
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce(50_000n)
    writeContract.mockResolvedValue('0x' + 'a'.repeat(64))
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 7n,
    })

    const result = await transmitSignedVote(input, {
      publicClient: publicClient as never,
      walletClient: walletClient as never,
      contractAddress: '0x0000000000000000000000000000000000000001',
      maxAttempts: 3,
    })

    expect(estimateContractGas).toHaveBeenCalledTimes(3)
    expect(result.txHash).toBe('0x' + 'a'.repeat(64))
  })

  it('UAT-03: does not retry insufficient funds and preserves error code', async () => {
    estimateContractGas.mockRejectedValue(
      new Error('insufficient funds for transfer')
    )

    await expect(
      transmitSignedVote(input, {
        publicClient: publicClient as never,
        walletClient: walletClient as never,
        contractAddress: '0x0000000000000000000000000000000000000001',
        maxAttempts: 3,
      })
    ).rejects.toMatchObject({
      code: 'insufficient_funds',
      canRetrySend: true,
    } satisfies Partial<VoteTxError>)

    expect(estimateContractGas).toHaveBeenCalledTimes(1)
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('VOTAR-379 UAT-04: castSignedVote no envía Authorization ni cookie SSO', async () => {
    estimateContractGas.mockResolvedValue(100_000n)
    writeContract.mockResolvedValue('0x' + 'f'.repeat(64))
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 42n,
    })

    await transmitSignedVote(input, {
      publicClient: publicClient as never,
      walletClient: walletClient as never,
      contractAddress: '0x0000000000000000000000000000000000000001',
    })

    const writeArgs = writeContract.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(writeArgs).not.toHaveProperty('Authorization')
    expect(writeArgs).not.toHaveProperty('headers')
    expect(Object.keys(writeArgs)).not.toContain('authorization')
    expect(String(writeArgs.abi)).not.toMatch(/Bearer|votar_voter/i)
    expect(writeArgs.functionName).toBe('castSignedVote')
  })

  it('applies ceil gas margin correctly', () => {
    expect(applyGasMargin(100n, 1.1)).toBe(110n)
    expect(applyGasMargin(101n, 1.1)).toBe(112n)
  })
})
