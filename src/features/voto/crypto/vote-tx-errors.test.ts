import {
  BaseError,
  ContractFunctionRevertedError,
  TimeoutError,
  decodeErrorResult,
  encodeErrorResult,
} from 'viem'
import { describe, expect, it } from 'vitest'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import {
  buildCooldownActiveMessage,
  remainingSecondsToMinutes,
  VOTE_TX_FALLBACK_MESSAGE,
  VOTE_TX_MESSAGES,
} from '@/features/voto/crypto/vote-tx-error-catalog'
import {
  buildOffChainCooldownActiveError,
  mapVoteTxError,
} from '@/features/voto/crypto/vote-tx-errors'

const createRevertedFromEncodedError = (
  errorName: string,
  args: unknown[] = []
) => {
  const data = encodeErrorResult({
    abi: BALLOT_CONTRACT_ABI,
    errorName: errorName as never,
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

describe('mapVoteTxError — VOTAR-358 / VOTAR-341 / VOTAR-359', () => {
  it('UAT-04: maps RevoteDisabled to already_registered (VOTAR-341)', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('RevoteDisabled', [])
    )
    expect(mapped.code).toBe('already_registered')
    expect(mapped.message).toMatch(/ya está registrado/i)
    expect(mapped.canRetrySend).toBe(false)
    expect(mapped.severity).toBe('error')
  })

  it('VOTAR-324: maps MaxVotesReached(electionId, maxVotes) to already_registered with the limit', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('MaxVotesReached', [339n, 2])
    )
    expect(mapped.code).toBe('already_registered')
    expect(mapped.message).toMatch(/2 sufragios permitidos/i)
    expect(mapped.canRetrySend).toBe(false)
    expect(mapped.severity).toBe('error')
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

  it('VOTAR-325 UAT-01: maps CooldownActive(electionId, 180) to 3 minutes warning', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('CooldownActive', [339n, 180n])
    )
    expect(mapped.code).toBe('retry_too_soon')
    expect(mapped.severity).toBe('warning')
    expect(mapped.message).toBe(
      'Debe esperar 3 minutos antes de volver a votar. Por favor, intente nuevamente más tarde.'
    )
    expect(mapped.remainingSeconds).toBe(180)
    expect(mapped.canRetrySend).toBe(false)
  })

  it('UAT-02: maps InvalidMerkleProof to not_eligible ticket copy', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('InvalidMerkleProof', [])
    )
    expect(mapped.code).toBe('not_eligible')
    expect(mapped.message).toBe(VOTE_TX_MESSAGES.notEligible)
    expect(mapped.severity).toBe('error')
    expect(mapped.canResign).toBe(true)
  })

  it('maps EnforcedPause to election_paused ticket copy', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('EnforcedPause', [])
    )
    expect(mapped.code).toBe('election_paused')
    expect(mapped.message).toBe(VOTE_TX_MESSAGES.electionPaused)
    expect(mapped.severity).toBe('warning')
    expect(mapped.revertName).toBe('EnforcedPause')
  })

  it('maps ElectionClosed to election_closed ticket copy', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('ElectionClosed', [7n])
    )
    expect(mapped.code).toBe('election_closed')
    expect(mapped.message).toBe(VOTE_TX_MESSAGES.electionClosed)
    expect(mapped.severity).toBe('error')
    expect(mapped.revertName).toBe('ElectionClosed')
  })

  it('maps InvalidSignature to ticket copy', () => {
    const mapped = mapVoteTxError(
      createRevertedFromEncodedError('InvalidSignature', [])
    )
    expect(mapped.code).toBe('invalid_signature')
    expect(mapped.message).toBe(VOTE_TX_MESSAGES.invalidSignature)
    expect(mapped.canResign).toBe(true)
  })

  it('maps unknown errors to fallback ticket copy', () => {
    const mapped = mapVoteTxError(new Error('unexpected rpc failure'))
    expect(mapped.code).toBe('unknown')
    expect(mapped.message).toBe(VOTE_TX_FALLBACK_MESSAGE)
  })

  it('maps insufficient funds to a corrective message', () => {
    const mapped = mapVoteTxError(new Error('insufficient funds for gas'))
    expect(mapped.code).toBe('insufficient_funds')
    expect(mapped.message).toMatch(/fondos suficientes/i)
    expect(mapped.canRetrySend).toBe(true)
  })

  it('marks network failures as transient and retryable', () => {
    const mapped = mapVoteTxError(new Error('Failed to fetch'))
    expect(mapped.code).toBe('network')
    expect(mapped.isTransient).toBe(true)
    expect(mapped.canRetrySend).toBe(true)
    expect(mapped.severity).toBe('warning')
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

  it('buildOffChainCooldownActiveError uses remaining seconds from backend', () => {
    const mapped = buildOffChainCooldownActiveError(150)
    expect(mapped.code).toBe('retry_too_soon')
    expect(mapped.remainingSeconds).toBe(150)
    expect(mapped.message).toBe(buildCooldownActiveMessage(3))
  })
})

describe('vote-tx-error-catalog helpers', () => {
  it('remainingSecondsToMinutes rounds up to at least 1', () => {
    expect(remainingSecondsToMinutes(1)).toBe(1)
    expect(remainingSecondsToMinutes(60)).toBe(1)
    expect(remainingSecondsToMinutes(61)).toBe(2)
    expect(remainingSecondsToMinutes(180)).toBe(3)
  })

  it('buildCooldownActiveMessage substitutes minutes', () => {
    expect(buildCooldownActiveMessage(3)).toContain('3 minutos')
  })
})
