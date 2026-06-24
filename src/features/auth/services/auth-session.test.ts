import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

const getMock = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
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
      }),
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
      }),
    )

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).resolves.toBeUndefined()
  })

  it('ignores non-403 errors', async () => {
    getMock.mockRejectedValue(new Error('network'))

    const { probeAdminAccessDenied } = await import('./auth-session')

    await expect(probeAdminAccessDenied()).resolves.toBeUndefined()
  })
})
