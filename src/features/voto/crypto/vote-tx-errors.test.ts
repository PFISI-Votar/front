import {
  BaseError,
  ContractFunctionRevertedError,
  TimeoutError,
  decodeErrorResult,
  encodeErrorResult,
} from 'viem'
import { describe, expect, it } from 'vitest'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import { mapVoteTxError } from '@/features/voto/crypto/vote-tx-errors'

const createRevertedFromEncodedError = (errorName: string, args: unknown[]) => {
  const data = encodeErrorResult({
    abi: BALLOT_CONTRACT_ABI,
    errorName: errorName as 'RevoteDisabled' | 'NullifierAlreadyUsed',
    args: args as never,
  })
  const decoded = decodeErrorResult({
    abi: BALLOT_CONTRACT_ABI,
    data,
  })
  const reverted = new ContractFunctionRevertedError({
    abi: BALLOT_CONTRACT_ABI,
    data,
    functionName: 'castSignedVote',
  })
  Object.assign(reverted, {
    data: {
      errorName: decoded.errorName,
      args: decoded.args,
    },
  })
  return new BaseError('execution reverted', { cause: reverted })
}

describe('mapVoteTxError — VOTAR-358 / VOTAR-341', () => {
  it('UAT-04: maps RevoteDisabled to already_registered (VOTAR-341)', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('RevoteDisabled', [])
    )
    expect(mapped.code).toBe('already_registered')
    expect(mapped.message).toMatch(/ya está registrado/i)
    expect(mapped.canRetrySend).toBe(false)
  })

  it('keeps legacy NullifierAlreadyUsed mapped to already_registered', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('NullifierAlreadyUsed', [
        '0x1111111111111111111111111111111111111111111111111111111111111111',
      ])
    )
    expect(mapped.code).toBe('already_registered')
    expect(mapped.message).toMatch(/ya está registrado/i)
    expect(mapped.canRetrySend).toBe(false)
  })

  it('decodes both double-vote selectors against BALLOT_CONTRACT_ABI', () => {
    const revoteData = encodeErrorResult({
      abi: BALLOT_CONTRACT_ABI,
      errorName: 'RevoteDisabled',
    })
    const legacyData = encodeErrorResult({
      abi: BALLOT_CONTRACT_ABI,
      errorName: 'NullifierAlreadyUsed',
      args: [
        '0x2222222222222222222222222222222222222222222222222222222222222222',
      ],
    })
    expect(
      decodeErrorResult({ abi: BALLOT_CONTRACT_ABI, data: revoteData })
        .errorName
    ).toBe('RevoteDisabled')
    expect(
      decodeErrorResult({ abi: BALLOT_CONTRACT_ABI, data: legacyData })
        .errorName
    ).toBe('NullifierAlreadyUsed')
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
