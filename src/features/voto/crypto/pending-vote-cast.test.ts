import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPendingVoteCast,
  loadPendingVoteCast,
  savePendingVoteCast,
} from '@/features/voto/crypto/pending-vote-cast'

const createMemoryStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
}

describe('pending-vote-cast — VOTAR-445', () => {
  let localStorageMock: ReturnType<typeof createMemoryStorage>

  beforeEach(() => {
    localStorageMock = createMemoryStorage()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists and loads a pending cast by election id', () => {
    const txHash = ('0x' + 'ab'.repeat(32)) as `0x${string}`
    savePendingVoteCast(7, txHash)

    expect(loadPendingVoteCast(7)).toEqual({
      idEleccion: 7,
      txHash,
      startedAt: expect.any(Number),
    })
    expect(loadPendingVoteCast(8)).toBeNull()
  })

  it('clears pending cast after success reconciliation', () => {
    savePendingVoteCast(7, ('0x' + 'cd'.repeat(32)) as `0x${string}`)
    clearPendingVoteCast(7)
    expect(loadPendingVoteCast(7)).toBeNull()
  })

  it('ignores corrupt storage payloads', () => {
    localStorageMock.setItem('votar:pending-vote-cast:7', '{not-json')
    expect(loadPendingVoteCast(7)).toBeNull()

    localStorageMock.setItem(
      'votar:pending-vote-cast:7',
      JSON.stringify({ idEleccion: 7, txHash: '0xdead', startedAt: 1 })
    )
    expect(loadPendingVoteCast(7)).toBeNull()
  })

  it('does not touch vote-seed keys used for nullifier continuity', () => {
    localStorageMock.setItem('votar:vote-seed:7', 'keep-me')
    savePendingVoteCast(7, ('0x' + 'ef'.repeat(32)) as `0x${string}`)
    clearPendingVoteCast(7)
    expect(localStorageMock.getItem('votar:vote-seed:7')).toBe('keep-me')
  })
})
