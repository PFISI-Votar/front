import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ParticipacionPublicaPage } from './participacion-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerParticipacionPublica: vi.fn(),
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

vi.mock('@/features/dashboard-publico/api/participacion-publica-api', () => ({
  obtenerParticipacionPublica: mocks.obtenerParticipacionPublica,
}))

vi.mock('@/features/dashboard-publico/components/curva-temporal-chart', () => ({
  CurvaTemporalChart: ({
    serieTemporal,
  }: {
    serieTemporal: Array<{ etiqueta: string; acumulado: number }>
  }) => (
    <div>
      <h3>Distribución temporal</h3>
      <p>{serieTemporal.length} puntos</p>
    </div>
  ),
}))

const participacionMock = {
  idEleccion: 6,
  snapshotCongelado: false,
  formula: {
    totalPadron: 100,
    votosAfirmativos: 25,
    votosEnBlanco: 0,
    votosNulos: 0,
    totalSufragios: 25,
    porcentajeParticipacion: 25,
    expresion: '(25 + 0 + 0) / 100 × 100 = 25%',
  },
  serieTemporal: [
    { etiqueta: '10:00', acumulado: 10, nuevos: 10 },
    { etiqueta: '11:00', acumulado: 25, nuevos: 15 },
  ],
  desglosePorCategoria: [
    {
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      listas: [
        { idLista: 10, nombreLista: 'Lista A', votos: 15 },
        { idLista: 20, nombreLista: 'Lista B', votos: 10 },
      ],
      votosEnBlancoGlobales: 0,
      votosNulosGlobales: 0,
    },
  ],
  verificacionTotales: {
    coherente: true,
    totalOnChain: 25,
    totalCalculado: 25,
  },
  fuenteDatos:
    'AuditViewContract.getParticipationStats + VoteRegistry.VoteCast',
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ParticipacionPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('ParticipacionPublicaPage — VOTAR-365', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: false,
      resultadosDefinitivos: false,
    })
    mocks.obtenerParticipacionPublica.mockResolvedValue(participacionMock)
  })

  it('UAT-01: muestra Participación Electoral: 25%', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Participación Electoral: 25%/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/\(25 \+ 0 \+ 0\) \/ 100/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Distribución temporal/i))
      .toBeInTheDocument()
  })

  it('UAT-02: muestra desglose por categoría y badge de coherencia', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Participación detallada por categoría/i))
      .toBeInTheDocument()
    await expect.element(screen.getByText('Lista A')).toBeInTheDocument()
    await expect.element(screen.getByText('Lista B')).toBeInTheDocument()
    await expect
      .element(screen.getByText(/Totales coherentes/i))
      .toBeInTheDocument()
  })

  it('muestra el panel de fórmula con operandos visibles', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Cálculo transparente/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Votos afirmativos', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Padrón habilitado', { exact: true }))
      .toBeInTheDocument()
  })

  it('muestra mensaje de snapshot cuando el dashboard está congelado', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CERRADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: true,
      resultadosDefinitivos: true,
    })
    mocks.obtenerParticipacionPublica.mockResolvedValue({
      ...participacionMock,
      snapshotCongelado: true,
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Snapshot congelado/i))
      .toBeInTheDocument()
  })

  it('muestra error amigable cuando las métricas no están disponibles', async () => {
    mocks.obtenerParticipacionPublica.mockRejectedValue(
      new AxiosError('Unprocessable', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
        data: { message: 'Sin contratos' },
      })
    )

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Métricas no disponibles/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/contratos electorales desplegados/i))
      .toBeInTheDocument()
  })
})
