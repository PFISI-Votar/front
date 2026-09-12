import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const refreshSessionMock = vi.fn()
const getCurrentUserMock = vi.fn()
const getLastActivityAtMock = vi.fn(() => Date.now())
const authResetMock = vi.fn()
const setSessionMock = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}))

vi.mock('@/features/auth/services/auth-api', () => ({
  refreshSession: () => refreshSessionMock(),
  getCurrentUser: () => getCurrentUserMock(),
}))

vi.mock('@/features/auth/services/activity-tracker', () => ({
  getLastActivityAt: () => getLastActivityAtMock(),
  startActivityTracking: vi.fn(),
  stopActivityTracking: vi.fn(),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      auth: { reset: authResetMock, setSession: setSessionMock },
    }),
  },
}))

describe('probeAdminAccessDenied', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /elecciones to trigger backend 403 and audit log', async () => {
    getMock.mockRejectedValue(
      new AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as never,
        data: { message: 'Acceso denegado' },
      })
    )

    const { probeAdminAccessDenied } = await import('./auth-session')
    await probeAdminAccessDenied()

    expect(getMock).toHaveBeenCalledWith('/elecciones')
  })

  it('swallows 403 without rethrowing', async () => {
    getMock.mockRejectedValue(
      new AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as never,
        data: {},
      })
    )

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).resolves.toBeUndefined()
  })

  it('rethrows non-403 errors without treating access as audited', async () => {
    const networkError = new Error('network')
    getMock.mockRejectedValue(networkError)

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).rejects.toBe(networkError)
  })

  it('rethrows when the probe succeeds without HTTP 403', async () => {
    getMock.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as never,
      data: [],
    })

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).rejects.toThrow(
      'succeeded without HTTP 403'
    )
  })

  it('rethrows HTTP 500 from the probe', async () => {
    const serverError = new AxiosError(
      'Internal Server Error',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
        data: {},
      }
    )
    getMock.mockRejectedValue(serverError)

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).rejects.toBe(serverError)
  })
})

describe('scheduled refresh — idle awareness (VOTAR-492)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    getLastActivityAtMock.mockReturnValue(Date.now())
  })

  afterEach(async () => {
    const { clearAccessTokenRefresh } = await import('./auth-session')
    clearAccessTokenRefresh()
    vi.useRealTimers()
  })

  it('does not refresh when the session has been idle past the timeout', async () => {
    const { scheduleAccessTokenRefresh } = await import('./auth-session')
    // 31 min ago (SESSION_IDLE_TIMEOUT default = 30 min).
    getLastActivityAtMock.mockReturnValue(Date.now() - 31 * 60 * 1000)

    scheduleAccessTokenRefresh()
    await vi.advanceTimersByTimeAsync(14 * 60 * 1000)

    expect(refreshSessionMock).not.toHaveBeenCalled()
    expect(authResetMock).toHaveBeenCalled()
  })

  it('refreshes when there has been recent activity', async () => {
    refreshSessionMock.mockResolvedValue({
      user: { sub: '1', role: 'election_admin' },
    })
    const { scheduleAccessTokenRefresh } = await import('./auth-session')
    getLastActivityAtMock.mockReturnValue(Date.now())

    scheduleAccessTokenRefresh()
    await vi.advanceTimersByTimeAsync(14 * 60 * 1000)

    expect(refreshSessionMock).toHaveBeenCalled()
  })
})
