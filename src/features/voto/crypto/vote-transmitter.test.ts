import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'
import {
  buildRelayerCastBody,
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
  validatorSignature: `0x${'cd'.repeat(65)}`,
}

describe('vote-transmitter — VOTAR-497', () => {
  const waitForTransactionReceipt = vi.fn()
  const relayCast = vi.fn()
  const onProgress = vi.fn()

  const publicClient = {
    waitForTransactionReceipt,
  }

  beforeEach(() => {
    waitForTransactionReceipt.mockReset()
    relayCast.mockReset()
    onProgress.mockReset()
  })

  it('UAT-01: pide el cast al relayer y espera el recibo sin clave local', async () => {
    relayCast.mockResolvedValue({ txHash: `0x${'f'.repeat(64)}` })
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 42n,
    })
    const onTxHash = vi.fn()

    const result = await transmitSignedVote(input, {
      publicClient: publicClient as never,
      relayCast,
      onProgress,
      onTxHash,
    })

    expect(relayCast).toHaveBeenCalledWith(input)
    expect(result.txHash).toBe(`0x${'f'.repeat(64)}`)
    expect(result.blockNumber).toBe(42n)
    expect(onTxHash).toHaveBeenCalledWith(`0x${'f'.repeat(64)}`)
    expect(onProgress.mock.calls.map((call) => call[0])).toEqual([
      'estimating',
      'sending',
      'confirming',
    ])
  })

  it('el body del relayer lleva candidateIds y la firma institucional, no una clave', () => {
    const body = buildRelayerCastBody(input, 'ab'.repeat(32))
    expect(body.candidateIds).toEqual(['101'])
    expect(body.validatorSignature).toBe(`0x${'cd'.repeat(65)}`)
    expect(body.relayToken).toBe('ab'.repeat(32))
    expect(JSON.stringify(body)).not.toMatch(/privateKey|VITE_PRIVATE_KEY/i)
  })

  it('VOTAR-445: waitForVoteTxReceipt resumes a broadcast cast', async () => {
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 77n,
    })

    const result = await waitForVoteTxReceipt(`0x${'a'.repeat(64)}` as never, {
      publicClient: publicClient as never,
    })

    expect(result).toEqual({
      txHash: `0x${'a'.repeat(64)}`,
      blockNumber: 77n,
    })
  })

  it('UAT-02: retries transient network errors up to 3 attempts', async () => {
    relayCast
      .mockRejectedValueOnce({
        code: 'network',
        message: 'red',
        severity: 'warning',
        isTransient: true,
        canRetrySend: true,
        canResign: false,
      } satisfies VoteTxError)
      .mockRejectedValueOnce({
        code: 'network',
        message: 'red',
        severity: 'warning',
        isTransient: true,
        canRetrySend: true,
        canResign: false,
      } satisfies VoteTxError)
      .mockResolvedValueOnce({ txHash: `0x${'a'.repeat(64)}` })
    waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 7n,
    })

    const result = await transmitSignedVote(input, {
      publicClient: publicClient as never,
      relayCast,
      maxAttempts: 3,
    })

    expect(relayCast).toHaveBeenCalledTimes(3)
    expect(result.txHash).toBe(`0x${'a'.repeat(64)}`)
  })

  it('UAT-03: does not retry insufficient funds and preserves error code', async () => {
    relayCast.mockRejectedValue({
      code: 'insufficient_funds',
      message: 'sin gas',
      severity: 'error',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
    } satisfies VoteTxError)

    await expect(
      transmitSignedVote(input, {
        publicClient: publicClient as never,
        relayCast,
        maxAttempts: 3,
      })
    ).rejects.toMatchObject({
      code: 'insufficient_funds',
      canRetrySend: true,
    } satisfies Partial<VoteTxError>)

    expect(relayCast).toHaveBeenCalledTimes(1)
  })

  it('no retransmite si el relayer ya devolvió el hash y falla el recibo', async () => {
    relayCast.mockResolvedValue({ txHash: `0x${'b'.repeat(64)}` })
    waitForTransactionReceipt.mockRejectedValue({
      code: 'timeout',
      message: 'La transacción no fue incluida en un bloque a tiempo.',
      severity: 'warning',
      isTransient: false,
      canRetrySend: true,
      canResign: true,
    })

    await expect(
      transmitSignedVote(input, {
        publicClient: publicClient as never,
        relayCast,
        maxAttempts: 3,
      })
    ).rejects.toMatchObject({ code: 'timeout' })

    expect(relayCast).toHaveBeenCalledTimes(1)
  })
})
