import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ContencionIncidentesCard } from '@/features/configuracion-sistema/components/contencion-incidentes-card'

vi.mock(
  '@/features/configuracion-sistema/hooks/use-configuracion-sistema',
  () => ({
    useConfiguracionSistema: () => ({
      data: {
        authBloqueoAlcance: 'NINGUNO',
        authBloqueoMotivo: null,
        authBloqueoDesde: null,
        authBloqueoPor: null,
      },
    }),
  })
)

const revocarTodasMutate = vi.fn()

vi.mock('@/features/configuracion-sistema/hooks/use-sesiones-activas', () => ({
  useRevocarSesionesUsuario: () => ({ mutate: vi.fn(), isPending: false }),
  useRevocarTodasLasSesiones: () => ({
    mutate: revocarTodasMutate,
    isPending: false,
  }),
  useActualizarAuthBloqueo: () => ({ mutate: vi.fn(), isPending: false }),
}))

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ContencionIncidentesCard />
    </QueryClientProvider>
  )

describe('ContencionIncidentesCard (VOTAR-492)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('el botón de revocación global exige escribir la frase de confirmación', async () => {
    renderCard()

    await userEvent.fill(
      page.getByLabelText('Motivo de revocación global'),
      'compromiso del proveedor de identidad institucional'
    )
    await userEvent.click(
      page.getByRole('button', { name: /Revocar TODAS las sesiones/i })
    )

    const confirmar = page.getByRole('button', { name: /^Revocar todas$/i })
    await expect.element(confirmar).toBeDisabled()

    await userEvent.fill(
      page.getByLabelText('Texto de confirmación'),
      'REVOCAR_TODAS_LAS_SESIONES'
    )
    await expect.element(confirmar).toBeEnabled()

    await userEvent.click(confirmar)
    expect(revocarTodasMutate).toHaveBeenCalled()
  })
})
