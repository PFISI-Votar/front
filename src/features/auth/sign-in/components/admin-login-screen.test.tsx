import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AdminLoginScreen } from '@/features/auth/sign-in/components/admin-login-screen'
import { VOTAR_LIGHT_SURFACE_CLASS } from '@/features/auth/sign-in/components/login-screen-shared'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setSession: vi.fn(),
    },
  }),
}))

vi.mock('@/features/auth/services/auth-api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/services/auth-api')>()
  return {
    ...actual,
    login: vi.fn(),
  }
})

vi.mock('@/features/auth/services/auth-session', () => ({
  scheduleAccessTokenRefresh: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('AdminLoginScreen', () => {
  beforeEach(() => {
    document.documentElement.classList.add('dark')
  })

  it('fuerza superficie clara y marca centrada bajo tema oscuro global (VOTAR-412)', async () => {
    const screen = await render(<AdminLoginScreen />)

    const main = document.querySelector('main')
    expect(main?.className).toContain('votar-light-surface')
    for (const token of VOTAR_LIGHT_SURFACE_CLASS.split(' ')) {
      expect(main?.className).toContain(token)
    }

    await expect.element(screen.getByText('VOTAR')).toBeInTheDocument()
    await expect
      .element(screen.getByText('Panel de Gestión'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(/^Usuario$/i))
      .toBeInTheDocument()
  })
})
