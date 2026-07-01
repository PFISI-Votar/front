import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
