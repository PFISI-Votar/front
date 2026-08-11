import { describe, expect, it } from 'vitest'
import {
  buildAnchorFromBackend,
  buildAnchorFromOnChain,
  computeRemainingSeconds,
  mergeCooldownAnchor,
  resolveCooldownAnchor,
} from '@/features/voto/crypto/cooldown-clock'

describe('cooldown-clock (VOTAR-449)', () => {
  it('extrapola el remaining con wall-clock aunque block.timestamp esté congelado', () => {
    const anchor = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 20,
        blockTimestamp: 1_000,
      },
      20,
      1_000_000
    )

    expect(anchor).not.toBeNull()
    expect(computeRemainingSeconds(anchor!, 1_000_000)).toBe(20)
    expect(computeRemainingSeconds(anchor!, 1_012_000)).toBe(8)
    expect(computeRemainingSeconds(anchor!, 1_020_000)).toBe(0)
  })

  it('no reinicia el countdown si un refetch on-chain repite el mismo block.timestamp', () => {
    const first = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 20,
        blockTimestamp: 1_000,
      },
      20,
      1_000_000
    )!

    // 12s de wall-clock después; el RPC sigue reportando el mismo bloque.
    const refetch = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 20,
        blockTimestamp: 1_000,
      },
      20,
      1_012_000
    )!

    const merged = mergeCooldownAnchor(first, refetch, 1_012_000)!
    expect(computeRemainingSeconds(merged, 1_012_000)).toBe(8)
  })

  it('al pasar de advisory backend a on-chain congelado no estira el remaining', () => {
    const backend = buildAnchorFromBackend(8, 1_012_000)!
    const onChain = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 20,
        blockTimestamp: 1_000,
      },
      20,
      1_012_000
    )!

    const merged = mergeCooldownAnchor(backend, onChain, 1_012_000)!
    expect(computeRemainingSeconds(merged, 1_012_000)).toBe(8)
    expect(merged.lastVoteAt).toBe(1_000)
  })

  it('acepta un remaining on-chain menor cuando el nodo sí avanzó', () => {
    const backend = buildAnchorFromBackend(15, 1_005_000)!
    const onChain = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 10,
        blockTimestamp: 1_010,
      },
      20,
      1_010_000
    )!

    const merged = mergeCooldownAnchor(backend, onChain, 1_010_000)!
    expect(computeRemainingSeconds(merged, 1_010_000)).toBe(10)
  })

  it('resetea el ancla cuando lastVoteAt cambia (nuevo sufragio)', () => {
    const previous = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 2,
        blockTimestamp: 1_018,
      },
      20,
      1_018_000
    )!

    const afterNewVote = buildAnchorFromOnChain(
      {
        lastVoteAt: 2_000,
        cooldownRemaining: 20,
        blockTimestamp: 2_000,
      },
      20,
      2_000_000
    )!

    const merged = mergeCooldownAnchor(previous, afterNewVote, 2_000_000)!
    expect(merged.lastVoteAt).toBe(2_000)
    expect(computeRemainingSeconds(merged, 2_000_000)).toBe(20)
  })

  it('re-sincroniza si el ticker local expiró pero la autoridad aún reporta espera', () => {
    const expired = buildAnchorFromOnChain(
      {
        lastVoteAt: 1_000,
        cooldownRemaining: 20,
        blockTimestamp: 1_000,
      },
      20,
      1_000_000
    )!
    const authority = buildAnchorFromBackend(7, 1_025_000)!

    const merged = mergeCooldownAnchor(expired, authority, 1_025_000)!
    expect(computeRemainingSeconds(merged, 1_025_000)).toBe(7)
  })

  it('resolveCooldownAnchor prioriza on-chain y cae al backend si aún no hay nullifier', () => {
    expect(
      resolveCooldownAnchor({
        minIntervalSeconds: 20,
        backendRemainingSeconds: 12,
        nowWallMs: 5_000,
      })
    ).toMatchObject({ lastVoteAt: 0 })

    const resolved = resolveCooldownAnchor({
      minIntervalSeconds: 20,
      backendRemainingSeconds: 12,
      voterState: {
        lastVoteAt: 100,
        cooldownRemaining: 5,
        blockTimestamp: 115,
      },
      nowWallMs: 115_000,
    })!
    expect(computeRemainingSeconds(resolved, 115_000)).toBe(5)
  })
})
