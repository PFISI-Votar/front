import { hexToBytes, keccak256, toBytes } from 'viem'
import { generatePrivateKey } from 'viem/accounts'
import { describe, expect, it } from 'vitest'
import { signDigestWithSecp256k1 } from '@/features/voto/crypto/secp256k1-digest-signer'

describe('signDigestWithSecp256k1 (VOTAR-418)', () => {
  it('returns an Ethereum signature (0x + r + s + v) for a 32-byte digest', async () => {
    const privateKey = hexToBytes(generatePrivateKey())
    const digest = keccak256(toBytes('votar-418-digest'))

    const signature = await signDigestWithSecp256k1(privateKey, digest)

    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/)
  })

  it('rejects a digest that is not 32 bytes', async () => {
    const privateKey = hexToBytes(generatePrivateKey())

    await expect(
      signDigestWithSecp256k1(privateKey, '0xdead' as `0x${string}`)
    ).rejects.toThrow('digest must be a 32-byte hex value')
  })

  it('rejects a private key that is not 32 bytes', async () => {
    const digest = keccak256(toBytes('votar-418-digest'))

    await expect(
      signDigestWithSecp256k1(new Uint8Array(16), digest)
    ).rejects.toThrow('privateKey must be a 32-byte Uint8Array')
  })
})
