import { describe, expect, it } from 'vitest'
import { createValidationCredential } from '@/features/voto/crypto/validation-credential'

describe('createValidationCredential — VOTAR-377', () => {
  it('genera commit = keccak256(secreto) y zeroize suelta el secreto', () => {
    const credential = createValidationCredential()
    expect(credential.secreto).toMatch(/^0x[0-9a-f]{64}$/)
    expect(credential.commit).toMatch(/^0x[0-9a-f]{64}$/)
    expect(credential.commit).not.toBe(credential.secreto)

    credential.zeroize()
    expect(() => credential.secreto).toThrow(/zeroizada/)
    credential.zeroize() // idempotente
  })
})
