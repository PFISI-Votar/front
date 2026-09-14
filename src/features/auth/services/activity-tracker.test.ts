import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredActivity,
  getLastActivityAt,
  startActivityTracking,
  stopActivityTracking,
} from './activity-tracker'

const STORAGE_KEY = 'votar.lastActivityAt'

describe('activity-tracker (VOTAR-492)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T12:00:00Z'))
  })

  afterEach(() => {
    stopActivityTracking()
    vi.useRealTimers()
  })

  it('seeds lastActivityAt on start when nothing is stored', () => {
    startActivityTracking()
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    expect(stored).toBe(Date.now())
  })

  it('records activity on a pointerdown once past the write throttle', () => {
    startActivityTracking()
    const seeded = getLastActivityAt()

    // Avanza más de 30s (el throttle de escritura) y dispara actividad.
    vi.setSystemTime(Date.now() + 31_000)
    window.dispatchEvent(new Event('pointerdown'))

    expect(getLastActivityAt()).toBe(Date.now())
    expect(getLastActivityAt()).toBeGreaterThan(seeded)
  })

  it('throttles writes within 30s', () => {
    startActivityTracking()
    vi.setSystemTime(Date.now() + 31_000)
    window.dispatchEvent(new Event('keydown'))
    const first = getLastActivityAt()

    vi.setSystemTime(Date.now() + 5_000)
    window.dispatchEvent(new Event('keydown'))
    expect(getLastActivityAt()).toBe(first)
  })

  it('getLastActivityAt falls back to now when storage is empty', () => {
    window.localStorage.clear()
    expect(getLastActivityAt()).toBe(Date.now())
  })

  it('always stamps Date.now() on start, even over a stale stored mark', () => {
    // Marca vencida de una sesión anterior (idle detectado hace 1h).
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() - 3_600_000))

    startActivityTracking()

    expect(getLastActivityAt()).toBe(Date.now())
  })

  it('does not treat visibilitychange as activity', () => {
    startActivityTracking()
    const seeded = getLastActivityAt()

    vi.setSystemTime(Date.now() + 31_000)
    document.dispatchEvent(new Event('visibilitychange'))

    expect(getLastActivityAt()).toBe(seeded)
  })

  it('clearStoredActivity removes the stored mark', () => {
    startActivityTracking()
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    clearStoredActivity()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
