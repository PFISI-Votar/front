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
 * VOTAR-385 — When a full BallotContract ABI was exported by the blockchain
 * pipeline, the curated frontend subset must remain a subset of that interface.
 */
describe('VOTAR-385 exported BallotContract ABI alignment', () => {
  const exportedPath = resolve(__dirname, 'abis/BallotContract.json')

  it('keeps castSignedVote in the curated runtime ABI', () => {
    const cast = BALLOT_CONTRACT_ABI.find(
      (entry) => entry.type === 'function' && entry.name === 'castSignedVote'
    )
    expect(cast).toBeDefined()
  })

  it('aligns curated function names with exported full ABI when present', () => {
    if (!existsSync(exportedPath)) {
      // Fresh clones without running export:abis still pass via curated ABI check above.
      expect(true).toBe(true)
      return
    }

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

    for (const entry of BALLOT_CONTRACT_ABI) {
      if (entry.name) {
        expect(exportedNames.has(entry.name)).toBe(true)
      }
    }
  })
})
