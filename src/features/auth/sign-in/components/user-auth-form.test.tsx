import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { ELECTION_ADMIN_ROLE } from '@/features/auth/types/auth.types'
import { UserAuthForm } from './user-auth-form'

const FORM_MESSAGES = {
  nickEmpty: 'Ingrese su usuario.',
  passwordEmpty: 'Ingrese su contraseña.',
} as const

const navigate = vi.fn()
const setSessionMock = vi.fn()
const loginMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setSession: setSessionMock,
    },
  }),
}))

vi.mock('@/features/auth/services/auth-api', () => ({
  login: (...args: unknown[]) => loginMock(...args),
}))

vi.mock('@/features/auth/services/auth-session', () => ({
  scheduleAccessTokenRefresh: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let nickInput: Locator
    let passwordInput: Locator
    let signInButton: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      loginMock.mockResolvedValue({
        user: {
          sub: '14988',
          role: ELECTION_ADMIN_ROLE,
          email: 'admin@test.local',
          name: 'Admin',
        },
      })
      screen = await render(<UserAuthForm variant='panel' />)
      nickInput = screen.getByRole('textbox', { name: /^Usuario$/i })
      passwordInput = screen.getByLabelText(/^Contraseña$/i)
      signInButton = screen.getByRole('button', {
        name: /Ingresar al panel/i,
      })
    })

    it('renders fields and submit button', async () => {
      await expect.element(nickInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText(FORM_MESSAGES.nickEmpty))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument()
    })

    it('authenticates election admin and navigates to default route', async () => {
      await userEvent.fill(nickInput, '14988')
      await userEvent.fill(passwordInput, 'secret')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(loginMock).toHaveBeenCalledOnce())
      expect(loginMock).toHaveBeenCalledWith({
        nick: '14988',
        password: 'secret',
      })
      expect(setSessionMock).toHaveBeenCalledOnce()
      expect(setSessionMock).toHaveBeenCalledWith(
        expect.objectContaining({ role: ELECTION_ADMIN_ROLE })
      )

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()
    loginMock.mockResolvedValue({
      user: { sub: '14988', role: ELECTION_ADMIN_ROLE },
    })

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/comicios' variant='panel' />
    )

    await userEvent.fill(getByRole('textbox', { name: /^Usuario$/i }), '14988')
    await userEvent.fill(getByLabelText(/^Contraseña$/i), 'secret')

    await userEvent.click(getByRole('button', { name: /Ingresar al panel/i }))

    await vi.waitFor(() => expect(setSessionMock).toHaveBeenCalledOnce())

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/comicios',
        replace: true,
      })
    )
  })

  it('denies voter without election_admin role and does not navigate', async () => {
    vi.clearAllMocks()
    loginMock.mockResolvedValue({
      user: {
        sub: '15079',
        role: 'voter',
        email: 'voter@test.local',
        name: 'Voter',
      },
    })

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm variant='panel' />
    )

    await userEvent.fill(getByRole('textbox', { name: /^Usuario$/i }), '15079')
    await userEvent.fill(getByLabelText(/^Contraseña$/i), 'secret')
    await userEvent.click(getByRole('button', { name: /Ingresar al panel/i }))

    await vi.waitFor(() => expect(loginMock).toHaveBeenCalledOnce())
    expect(setSessionMock).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Acceso denegado. Su cuenta no tiene privilegios de Autoridad Electoral.'
    )
  })

  it('shows 2FA step when login returns a challenge', async () => {
    vi.clearAllMocks()
    loginMock.mockResolvedValue({
      twoFactor: {
        status: 'verification_required',
        challengeToken: 'challenge-token',
      },
    })

    const { getByRole, getByLabelText, getByText } = await render(
      <UserAuthForm variant='panel' />
    )

    await userEvent.fill(getByRole('textbox', { name: /^Usuario$/i }), '14988')
    await userEvent.fill(getByLabelText(/^Contraseña$/i), 'secret')
    await userEvent.click(getByRole('button', { name: /Ingresar al panel/i }))

    await vi.waitFor(() => expect(loginMock).toHaveBeenCalledOnce())
    await expect
      .element(getByText(/código de 6 dígitos/i))
      .toBeInTheDocument()
    expect(setSessionMock).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
