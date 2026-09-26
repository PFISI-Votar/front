import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { describe, expect, it } from 'vitest'
import { computeSelectionHash } from '@/features/voto/crypto/selection-hash'
import {
  buildVoteTypedDataDomain,
  signVotePayload,
} from '@/features/voto/crypto/vote-signer'

const TEST_CONTRACT = '0x0000000000000000000000000000000000000001' as const
const TEST_NULLIFIER =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as const

describe('vote-signer', () => {
  it('signs an EIP-712 vote payload with electionId, nullifier, selectionHash, candidateIds and timestamp', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const selection = {
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    }

    const signed = await signVotePayload(account, 357, selection, {
      nullifier: TEST_NULLIFIER,
      timestamp: 1_700_000_000,
      chainId: 31_337,
      verifyingContract: TEST_CONTRACT,
    })

    expect(signed.electionId).toBe(357)
    expect(signed.timestamp).toBe(1_700_000_000)
    expect(signed.expectedSigner).toBe(account.address)
    expect(signed.nullifier).toBe(TEST_NULLIFIER)
    expect(signed.selectionHash).toBe(computeSelectionHash(selection))
    expect(signed.candidateIds).toEqual([101n, 201n])
    expect(signed.signature).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('rejects an invalid nullifier instead of deriving one', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    await expect(
      signVotePayload(
        account,
        357,
        { selecciones: [{ idCategoria: 1, idCandidato: 101 }] },
        { nullifier: '0xdead' as `0x${string}` }
      )
    ).rejects.toThrow(/nullifier must be a 32-byte hex value/)
  })

  it('builds the typed-data domain with name, version, chainId and verifyingContract', () => {
    expect(buildVoteTypedDataDomain(TEST_CONTRACT, 31_337)).toEqual({
      name: 'VOTAR',
      version: '2',
      chainId: 31_337,
      verifyingContract: TEST_CONTRACT,
    })
  })
})
