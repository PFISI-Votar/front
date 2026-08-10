import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { RevotoPublicaPage } from './revoto-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerRevotoStatsPublica: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    to?: string
    params?: Record<string, string>
    className?: string
  }) => (
    <a href={props.to ?? '#'} className={props.className}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/dashboard-publico/api/revoto-stats-publica-api', () => ({
  obtenerRevotoStatsPublica: mocks.obtenerRevotoStatsPublica,
}))

vi.mock(
  '@/features/dashboard-publico/components/revoto-overwrite-chart',
  () => ({
    RevotoOverwriteChart: ({
      serieTemporal,
    }: {
      serieTemporal: Array<{ etiqueta: string; overwriteRatio: number }>
    }) => (
      <div>
        <h3>Tasa de sobreescritura acumulada</h3>
        <p>{serieTemporal.length} puntos</p>
      </div>
    ),
  })
)

const revotoMock = {
  idEleccion: 6,
  snapshotCongelado: false,
  totalRevotes: 30,
  uniqueVoters: 70,
  overwriteRatio: 0.3,
  serieTemporal: [
    {
      etiqueta: '10:00',
      overwriteRatio: 0.2,
      totalRevotes: 10,
      totalEventos: 50,
    },
    {
      etiqueta: '11:00',
      overwriteRatio: 0.3,
      totalRevotes: 30,
      totalEventos: 100,
    },
  ],
  fuenteDatos:
    'AuditViewContract.getRevoteStats + transaccion_blockchain (VOTAR-373)',
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <RevotoPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('RevotoPublicaPage — VOTAR-329', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Comicio UTN',
      estado: 'ABIERTA',
      mostrarResultadosTiempoReal: true,
    })
    mocks.obtenerRevotoStatsPublica.mockResolvedValue(revotoMock)
  })

  it('UAT-01: muestra totalRevotes, uniqueVoters y overwriteRatio', async () => {
    const screen = await renderPage(6)

    await vi.waitFor(() => {
      expect(screen.getByText('30')).toBeTruthy()
      expect(screen.getByText('70')).toBeTruthy()
      expect(screen.getByText('0,30')).toBeTruthy()
    })

    expect(screen.getByText('totalRevotes')).toBeTruthy()
    expect(screen.getByText('uniqueVoters')).toBeTruthy()
    expect(screen.getByText('overwriteRatio')).toBeTruthy()
    expect(screen.getByText(/AuditViewContract\.getRevoteStats/)).toBeTruthy()
  })

  it('muestra error cuando el comicio no tiene contratos on-chain', async () => {
    mocks.obtenerRevotoStatsPublica.mockRejectedValue(
      new AxiosError('Unprocessable', undefined, undefined, undefined, {
        status: 422,
        data: {},
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
      })
    )

    const screen = await renderPage(6)

    await vi.waitFor(() => {
      expect(screen.getByText('Métricas no disponibles')).toBeTruthy()
    })
  })
})
