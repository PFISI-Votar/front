import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'
import { ELECTION_ADMIN_ROLE } from '@/features/auth/types/auth.types'

const FORM_MESSAGES = {
  nickEmpty: 'Ingrese su usuario institucional de Autogestión UTN.',
  passwordEmpty: 'Ingrese su contraseña.',
} as const

const navigate = vi.fn()
const setSessionMock = vi.fn()
const loginMock = vi.fn()

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
        accessToken: 'jwt-token',
        user: {
          sub: '14988',
          role: ELECTION_ADMIN_ROLE,
          email: 'admin@test.local',
          name: 'Admin',
        },
      })
      screen = await render(<UserAuthForm />)
      nickInput = screen.getByRole('textbox', { name: /Usuario institucional/i })
      passwordInput = screen.getByLabelText(/^Contraseña$/i)
      signInButton = screen.getByRole('button', {
        name: /Ingresar al Panel de Gestión/i,
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
        expect.objectContaining({ role: ELECTION_ADMIN_ROLE }),
        'jwt-token'
      )

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()
    loginMock.mockResolvedValue({
      accessToken: 'jwt-token',
      user: { sub: '14988', role: ELECTION_ADMIN_ROLE },
    })

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/comicios' />
    )

    await userEvent.fill(
      getByRole('textbox', { name: /Usuario institucional/i }),
      '14988'
    )
    await userEvent.fill(getByLabelText('Contraseña'), 'secret')

    await userEvent.click(
      getByRole('button', { name: /Ingresar al Panel de Gestión/i })
    )

    await vi.waitFor(() => expect(setSessionMock).toHaveBeenCalledOnce())

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/comicios',
        replace: true,
      })
    )
  })
})
