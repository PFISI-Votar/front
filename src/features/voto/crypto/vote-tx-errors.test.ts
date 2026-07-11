import { BaseError, ContractFunctionRevertedError, TimeoutError } from 'viem'
import { describe, expect, it } from 'vitest'
import { mapVoteTxError } from '@/features/voto/crypto/vote-tx-errors'

describe('mapVoteTxError — VOTAR-358', () => {
  it('UAT-04: maps NullifierAlreadyUsed to already_registered', () => {
    const reverted = new ContractFunctionRevertedError({
      abi: [
        {
          type: 'error',
          name: 'NullifierAlreadyUsed',
          inputs: [{ name: 'nullifier', type: 'bytes32' }],
        },
      ],
      data: '0x',
      functionName: 'castSignedVote',
    })
    Object.assign(reverted, {
      data: {
        errorName: 'NullifierAlreadyUsed',
        args: [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        ],
      },
    })
    const base = new BaseError('execution reverted', { cause: reverted })
    const mapped = mapVoteTxError(base)
    expect(mapped.code).toBe('already_registered')
    expect(mapped.message).toMatch(/ya está registrado/i)
    expect(mapped.canRetrySend).toBe(false)
  })

  it('UAT-03: maps insufficient funds to a corrective message', () => {
    const mapped = mapVoteTxError(new Error('insufficient funds for gas'))
    expect(mapped.code).toBe('insufficient_funds')
    expect(mapped.message).toMatch(/fondos suficientes/i)
    expect(mapped.canRetrySend).toBe(true)
  })

  it('UAT-02: marks network failures as transient and retryable', () => {
    const mapped = mapVoteTxError(new Error('Failed to fetch'))
    expect(mapped.code).toBe('network')
    expect(mapped.isTransient).toBe(true)
    expect(mapped.canRetrySend).toBe(true)
  })

  it('maps mining timeout with retry and resign options', () => {
    const mapped = mapVoteTxError(
      new TimeoutError({
        body: {},
        url: 'http://localhost',
      })
    )
    expect(mapped.code).toBe('timeout')
    expect(mapped.canRetrySend).toBe(true)
    expect(mapped.canResign).toBe(true)
  })
})
