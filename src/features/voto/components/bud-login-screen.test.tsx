import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BudLoginScreen } from '@/features/voto/components/bud-login-screen'
import { VOTER_ROLE } from '@/features/voto/types/votante-auth.types'

const loginVotanteMock = vi.fn()
const onAuthenticatedMock = vi.fn()

vi.mock('@/features/voto/services/votante-auth-api', () => ({
  loginVotante: (...args: unknown[]) => loginVotanteMock(...args),
}))

const GENERIC_LOGIN_ERROR =
  'No pudimos iniciar sesión. Verificá tus credenciales institucionales e intentá nuevamente.'

describe('BudLoginScreen', () => {
  beforeEach(() => {
    loginVotanteMock.mockReset()
    onAuthenticatedMock.mockReset()
  })

  it('muestra error genérico ante credenciales inválidas sin filtrar detalles del servidor', async () => {
    loginVotanteMock.mockRejectedValue(
      new AxiosError('Unauthorized', '401', undefined, undefined, {
        status: 401,
        data: { message: 'Credenciales institucionales inválidas' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      })
    )

    const screen = await render(
      <BudLoginScreen idEleccion={2} onAuthenticated={onAuthenticatedMock} />
    )

    await userEvent.fill(screen.getByLabelText(/^Número de Legajo$/i), '14988')
    await userEvent.fill(
      screen.getByLabelText(/^Clave Institucional$/i),
      'wrong-password'
    )
    await userEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    await expect
      .element(screen.getByText(GENERIC_LOGIN_ERROR))
      .toBeInTheDocument()
    expect(onAuthenticatedMock).not.toHaveBeenCalled()
  })

  it('autentica votante habilitado y notifica al contenedor padre', async () => {
    loginVotanteMock.mockResolvedValue({
      user: {
        sub: '14988',
        role: VOTER_ROLE,
        idEleccion: 2,
        email: 'votante@test.local',
        name: 'Votante UAT',
      },
    })

    const screen = await render(
      <BudLoginScreen idEleccion={2} onAuthenticated={onAuthenticatedMock} />
    )

    await userEvent.fill(screen.getByLabelText(/^Número de Legajo$/i), '14988')
    await userEvent.fill(
      screen.getByLabelText(/^Clave Institucional$/i),
      'secret'
    )
    await userEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    await vi.waitFor(() => expect(loginVotanteMock).toHaveBeenCalledOnce())
    expect(loginVotanteMock).toHaveBeenCalledWith({
      nick: '14988',
      password: 'secret',
      idEleccion: 2,
    })
    expect(onAuthenticatedMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: VOTER_ROLE, idEleccion: 2 })
    )
  })

  it('valida campos obligatorios antes de invocar al backend', async () => {
    const screen = await render(
      <BudLoginScreen idEleccion={2} onAuthenticated={onAuthenticatedMock} />
    )

    await userEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    await expect
      .element(screen.getByText('Ingresá tu legajo y clave institucional.'))
      .toBeInTheDocument()
    expect(loginVotanteMock).not.toHaveBeenCalled()
  })
})
