import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { describe, expect, it } from 'vitest'
import { deriveNullifier } from '@/features/voto/crypto/nullifier'
import { computeSelectionHash } from '@/features/voto/crypto/selection-hash'
import {
  buildVoteTypedDataDomain,
  signVotePayload,
} from '@/features/voto/crypto/vote-signer'

const TEST_CONTRACT = '0x0000000000000000000000000000000000000001' as const

describe('vote-signer', () => {
  it('derives a stable nullifier per election and ephemeral key', () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const first = deriveNullifier(account.address, 357)
    const second = deriveNullifier(account.address, 357)
    const otherElection = deriveNullifier(account.address, 358)

    expect(first).toEqual(second)
    expect(first).not.toEqual(otherElection)
  })

  it('signs an EIP-712 vote payload with electionId, nullifier, selectionHash and timestamp', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const selection = {
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    }

    const signed = await signVotePayload(account, 357, selection, {
      timestamp: 1_700_000_000,
      chainId: 31_337,
      verifyingContract: TEST_CONTRACT,
    })

    expect(signed.electionId).toBe(357)
    expect(signed.timestamp).toBe(1_700_000_000)
    expect(signed.expectedSigner).toBe(account.address)
    expect(signed.nullifier).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(signed.selectionHash).toBe(computeSelectionHash(selection))
    expect(signed.signature).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('builds the typed-data domain with name, version, chainId and verifyingContract', () => {
    expect(buildVoteTypedDataDomain(TEST_CONTRACT, 31_337)).toEqual({
      name: 'VOTAR',
      version: '1',
      chainId: 31_337,
      verifyingContract: TEST_CONTRACT,
    })
  })
})
