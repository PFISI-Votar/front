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
 * No forward-compat entries pending — VOTAR-325's RetryTooSoon shipped in the
 * same deployment as its ABI export, so the curated set stays a strict subset.
 */
const CURATED_FORWARD_COMPAT_NAMES = new Set<string>()

/**
 * VOTAR-345 — These errors are thrown by VoteRegistry.recordVote (called from
 * BallotContract.castSignedVote), not declared on BallotContract.sol itself.
 * They must stay decodable from a castSignedVote revert, so they live in the
 * curated ABI, but they are intentionally absent from BallotContract's export.
 */
const CURATED_CROSS_CONTRACT_NAMES = new Set([
  'InvalidCandidateId',
  'CandidateSetNotRegistered',
  'EmptyBallotSelection',
  'TooManyCandidates',
  'DuplicateCandidateId',
])

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

    const voteRegistryPath = resolve(__dirname, 'abis/VoteRegistry.json')
    if (existsSync(voteRegistryPath)) {
      const voteRegistryPayload = JSON.parse(
        readFileSync(voteRegistryPath, 'utf8')
      ) as ExportedAbiPayload
      const voteRegistryNames = new Set(
        voteRegistryPayload.abi.map((e) => e.name).filter(Boolean)
      )
      for (const name of CURATED_CROSS_CONTRACT_NAMES) {
        expect(voteRegistryNames.has(name)).toBe(true)
      }
    }

    for (const entry of BALLOT_CONTRACT_ABI) {
      if (!entry.name) continue
      if (CURATED_LEGACY_ONLY_NAMES.has(entry.name)) continue
      if (CURATED_FORWARD_COMPAT_NAMES.has(entry.name)) continue
      if (CURATED_CROSS_CONTRACT_NAMES.has(entry.name)) continue
      expect(exportedNames.has(entry.name)).toBe(true)
    }
  })
})
