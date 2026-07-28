import { describe, expect, it, vi } from 'vitest'
import {
  buildVoteTxErrorLogPayload,
  logVoteTxError,
} from '@/features/voto/crypto/log-vote-tx-error'

describe('logVoteTxError — VOTAR-359 UAT-03', () => {
  it('logs only sanitized fields without cause or hex secrets', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    logVoteTxError({
      electionId: 7,
      revertName: 'InvalidSignature',
      code: 'invalid_signature',
    })

    expect(consoleError).toHaveBeenCalledOnce()
    const payload = consoleError.mock.calls[0]?.[1] as Record<string, unknown>
    expect(payload).toMatchObject({
      electionId: 7,
      revertName: 'InvalidSignature',
      code: 'invalid_signature',
    })
    expect(typeof payload.timestamp).toBe('string')
    expect(JSON.stringify(payload)).not.toMatch(/0x/i)
    expect(payload).not.toHaveProperty('cause')
    expect(payload).not.toHaveProperty('signature')
    expect(payload).not.toHaveProperty('nullifier')
    expect(payload).not.toHaveProperty('nonce')
    expect(payload).not.toHaveProperty('contractAddress')

    consoleError.mockRestore()
  })

  it('buildVoteTxErrorLogPayload defaults revertName to unknown', () => {
    const payload = buildVoteTxErrorLogPayload(
      { electionId: 3, code: 'unknown' },
      '2026-07-21T12:00:00.000Z'
    )
    expect(payload).toEqual({
      timestamp: '2026-07-21T12:00:00.000Z',
      electionId: 3,
      revertName: 'unknown',
      code: 'unknown',
    })
  })
})
