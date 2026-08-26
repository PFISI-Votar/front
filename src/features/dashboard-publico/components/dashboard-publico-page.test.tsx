import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { DashboardPublicoPage } from './dashboard-publico-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  useTotalVotantesPublico: vi.fn(),
  useEscrutinio: vi.fn(),
  useDashboardResultadosWebSocket: vi.fn(),
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

vi.mock('@/features/padron/hooks/use-padron', () => ({
  useTotalVotantesPublico: mocks.useTotalVotantesPublico,
}))

vi.mock('@/features/dashboard-publico/hooks/use-escrutinio', () => ({
  useEscrutinio: mocks.useEscrutinio,
  escrutinioQueryKey: (id: number) => ['dashboard-publico-escrutinio', id],
}))

vi.mock(
  '@/features/dashboard-publico/hooks/use-dashboard-resultados-websocket',
  () => ({
    useDashboardResultadosWebSocket: mocks.useDashboardResultadosWebSocket,
  })
)

vi.mock('@/features/dashboard-publico/api/participacion-publica-api', () => ({
  obtenerParticipacionPublica: mocks.obtenerParticipacionPublica,
}))

const mockEscrutinioLive = {
  idEleccion: 6,
  nombre: 'Elección Centro de Estudiantes',
  estado: 'ABIERTA',
  tipoVotacion: 'POR_LISTA',
  congelado: false,
  fuente: 'ON_CHAIN' as const,
  actualizadoEn: new Date().toISOString(),
  participacion: {
    totalVotos: 12,
    votosBlanco: 1,
    votosNulo: 0,
    totalVotantesHabilitados: 1500,
    porcentajeParticipacion: 0.8,
  },
  candidatos: [
    {
      idCandidato: 1,
      nombre: 'Ana',
      apellido: 'Pérez',
      idLista: 1,
      nombreLista: 'Lista A',
      siglaLista: 'LA',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 11,
      porcentaje: 91.7,
    },
  ],
}

const renderPage = async (
  idEleccion: number,
  section?: 'resumen' | 'padron' | 'estado' | 'resultados' | 'oferta'
) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <DashboardPublicoPage idEleccion={idEleccion} section={section} />
    </QueryClientProvider>
  )
}

describe('DashboardPublicoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useTotalVotantesPublico.mockReturnValue({
      data: { totalVotantesHabilitados: 1500 },
      isLoading: false,
      isError: false,
    })
    mocks.useEscrutinio.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
    mocks.useDashboardResultadosWebSocket.mockReturnValue(undefined)
    mocks.obtenerParticipacionPublica.mockResolvedValue({
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
      serieTemporal: [],
      desglosePorCategoria: [],
      verificacionTotales: {
        coherente: true,
        totalOnChain: 25,
        totalCalculado: 25,
      },
      fuenteDatos: 'AuditViewContract.getParticipationStats',
    })
  })

  it('rechaza un identificador de comicio inválido', async () => {
    const screen = await renderPage(Number.NaN)

    await expect
      .element(screen.getByText(/Identificador de comicio inválido/i))
      .toBeInTheDocument()
  })

  it('muestra error cuando el comicio no existe', async () => {
    mocks.obtenerConfiguracionBud.mockRejectedValue(
      new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: { message: 'Comicio no encontrado' },
      })
    )

    const screen = await renderPage(99)

    await expect
      .element(screen.getByText(/Comicio no encontrado/i))
      .toBeInTheDocument()
  })

  it('expone indicadores públicos sin autenticación (UAT-01)', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CONFIGURADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Elección Centro de Estudiantes/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Acceso público/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Total de votantes habilitados'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(/1\.500 votantes habilitados/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Estado del comicio'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('navigation', { name: /dashboard público/i }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByText(
          /escrutinio estará disponible cuando el comicio esté abierto/i
        )
      )
      .toBeInTheDocument()
  })

  it('muestra el mismo indicador cuando el comicio está abierto', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useEscrutinio.mockReturnValue({
      data: mockEscrutinioLive,
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Estado del comicio'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(/1\.500 votantes habilitados/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Actualización periódica activa/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('group', { name: /participación/i }))
      .toBeInTheDocument()
    await expect.element(screen.getByText('Votos emitidos')).toBeInTheDocument()
  })

  it('renderiza sección resultados con gráficos (VOTAR-364)', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useEscrutinio.mockReturnValue({
      data: mockEscrutinioLive,
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6, 'resultados')

    await expect
      .element(screen.getByRole('heading', { name: /^Votos por candidato$/i }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('heading', { name: /^Distribución relativa$/i })
      )
      .toBeInTheDocument()
  })

  it('muestra banner congelado cuando el snapshot está frozen', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CERRADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      resultadosDefinitivos: true,
      snapshotCongelado: true,
    })
    mocks.useEscrutinio.mockReturnValue({
      data: {
        ...mockEscrutinioLive,
        estado: 'CERRADA',
        congelado: true,
      },
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6, 'resultados')

    await expect
      .element(screen.getByText(/resultados son definitivos e inmutables/i))
      .toBeInTheDocument()
  })

  it('permite navegar a sub-rutas de auditoría sin login (UAT-02)', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useEscrutinio.mockReturnValue({
      data: mockEscrutinioLive,
      isLoading: false,
      isError: false,
    })

    const padronScreen = await renderPage(6, 'padron')
    await expect
      .element(padronScreen.getByText('Total de votantes habilitados'))
      .toBeInTheDocument()

    const estadoScreen = await renderPage(6, 'estado')
    await expect
      .element(estadoScreen.getByText('Estado del comicio'))
      .toBeInTheDocument()
  })

  it('VOTAR-459: resumen simplificado cuando resultados y participación están ocultos', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      visibilidadDashboard: {
        resultados: false,
        participacion: false,
        revoto: true,
        transacciones: true,
      },
    })
    mocks.useEscrutinio.mockReturnValue({
      data: mockEscrutinioLive,
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6)

    // Resultados y Participación se omiten en silencio en el resumen…
    await expect
      .element(
        screen.getByText(
          /escrutinio estará disponible cuando el comicio esté abierto/i
        )
      )
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('group', { name: /participación/i }))
      .not.toBeInTheDocument()
    // …y las solapas correspondientes no aparecen en el nav.
    await expect
      .element(screen.getByRole('link', { name: 'Resultados' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('link', { name: 'Participación' }))
      .not.toBeInTheDocument()
    // Padrón y Estado (siempre visibles) permanecen intactos.
    await expect
      .element(screen.getByText('Total de votantes habilitados'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Estado del comicio'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('link', { name: 'Re-voto' }))
      .toBeInTheDocument()
  })

  it('VOTAR-459: muestra "Sección no disponible" al navegar directo a /resultados si está oculta', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      visibilidadDashboard: {
        resultados: false,
        participacion: true,
        revoto: true,
        transacciones: true,
      },
    })

    const screen = await renderPage(6, 'resultados')

    await expect
      .element(screen.getByText(/Sección no disponible/i))
      .toBeInTheDocument()
  })

  it('muestra estado vacío de padrón cuando el total no está disponible', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useTotalVotantesPublico.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    mocks.useEscrutinio.mockReturnValue({
      data: mockEscrutinioLive,
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6, 'padron')

    await expect
      .element(screen.getByText(/Padrón aún no consolidado/i))
      .toBeInTheDocument()
  })
})
