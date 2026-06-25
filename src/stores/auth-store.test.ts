import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ELECTION_ADMIN_ROLE,
  type AuthUser,
} from '@/features/auth/types/auth.types'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

const sampleUser: AuthUser = {
  sub: '14988',
  role: ELECTION_ADMIN_ROLE,
  email: 'admin@votar.local',
  name: 'Admin Test',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('starts without an authenticated user', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.isAuthenticated()).toBe(false)
  })

  it('stores the signed-in user in memory', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession(sampleUser)

    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
    expect(useAuthStore.getState().auth.isAuthenticated()).toBe(true)
  })

  it('updates the signed-in user via setUser', async () => {
    const useAuthStore = await importAuthStore()

    useAuthStore.getState().auth.setUser({ ...sampleUser })

    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
  })

  it('reset clears the in-memory user', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession(sampleUser)

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.isAuthenticated()).toBe(false)
  })

  it('isElectionAdmin returns true for election_admin role', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession(sampleUser)

    expect(useAuthStore.getState().auth.isElectionAdmin()).toBe(true)
  })
})
