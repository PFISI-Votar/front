import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VOTAR_LIGHT_SURFACE_CLASS } from '@/features/auth/sign-in/components/login-screen-shared'
import { OBSERVACION_LOGIN_DEFAULT } from '@/features/eleccion/data/observacion-login'
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
    document.documentElement.classList.add('dark')
  })

  it('fuerza superficie clara y marca VOTAR bajo tema oscuro global (VOTAR-412)', async () => {
    const screen = await render(
      <BudLoginScreen idEleccion={2} onAuthenticated={onAuthenticatedMock} />
    )

    const main = document.querySelector('main')
    expect(main?.className).toContain('votar-light-surface')
    for (const token of VOTAR_LIGHT_SURFACE_CLASS.split(' ')) {
      expect(main?.className).toContain(token)
    }

    await expect.element(screen.getByText('VOTAR')).toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(/^Número de Legajo$/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(OBSERVACION_LOGIN_DEFAULT))
      .toBeInTheDocument()
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

  it('VOTAR-454: muestra la observación configurada en el borrador del comicio', async () => {
    const screen = await render(
      <BudLoginScreen
        idEleccion={2}
        observacionLogin='Ingresá con tu correo institucional.'
        onAuthenticated={onAuthenticatedMock}
      />
    )

    await expect
      .element(screen.getByText('Ingresá con tu correo institucional.'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(OBSERVACION_LOGIN_DEFAULT))
      .not.toBeInTheDocument()
  })

  it('VOTAR-454: oculta el recuadro si la observación quedó vacía', async () => {
    const screen = await render(
      <BudLoginScreen
        idEleccion={2}
        observacionLogin=''
        onAuthenticated={onAuthenticatedMock}
      />
    )

    await expect.element(screen.getByText('Bienvenido')).toBeInTheDocument()
    await expect
      .element(screen.getByText(OBSERVACION_LOGIN_DEFAULT))
      .not.toBeInTheDocument()
  })
})
