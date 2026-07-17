import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'

type ExportedAbiPayload = {
  contractName: string
  abiHash: string
  abi: Array<{ type?: string; name?: string }>
}

/**
 * Curated-only names kept for decoding legacy Sepolia deployments
 * (VOTAR-341). They are intentionally absent from the current export.
 */
const CURATED_LEGACY_ONLY_NAMES = new Set(['NullifierAlreadyUsed'])

/**
 * VOTAR-385 — When a full BallotContract ABI was exported by the blockchain
 * pipeline, the curated frontend subset must remain a subset of that interface
 * (except documented legacy decode entries).
 */
describe('VOTAR-385 exported BallotContract ABI alignment', () => {
  const exportedPath = resolve(__dirname, 'abis/BallotContract.json')

  it('keeps castSignedVote in the curated runtime ABI', () => {
    const cast = BALLOT_CONTRACT_ABI.find(
      (entry) => entry.type === 'function' && entry.name === 'castSignedVote'
    )
    expect(cast).toBeDefined()
  })

  it('aligns curated names with exported full ABI when present', () => {
    expect(existsSync(exportedPath)).toBe(true)

    const payload = JSON.parse(
      readFileSync(exportedPath, 'utf8')
    ) as ExportedAbiPayload
    expect(payload.contractName).toBe('BallotContract')

    const exportedNames = new Set(
      payload.abi
        .filter(
          (e) =>
            e.type === 'function' || e.type === 'error' || e.type === 'event'
        )
        .map((e) => e.name)
        .filter(Boolean)
    )

    expect(exportedNames.has('RevoteDisabled')).toBe(true)

    for (const entry of BALLOT_CONTRACT_ABI) {
      if (!entry.name) continue
      if (CURATED_LEGACY_ONLY_NAMES.has(entry.name)) continue
      expect(exportedNames.has(entry.name)).toBe(true)
    }
  })
})
