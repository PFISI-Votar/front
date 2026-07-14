import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { DashboardPublicoPage } from './dashboard-publico-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  useTotalVotantesPublico: vi.fn(),
  obtenerEscrutinioPublico: vi.fn(),
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

vi.mock('@/features/dashboard-publico/api/dashboard-publico-api', () => ({
  obtenerEscrutinioPublico: mocks.obtenerEscrutinioPublico,
}))

const renderPage = async (
  idEleccion: number,
  section?: 'resumen' | 'padron' | 'estado' | 'resultados'
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
    mocks.obtenerEscrutinioPublico.mockResolvedValue({
      idEleccion: 6,
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      participacion: {
        votosFiscalizados: 375,
        votosEnBlanco: 10,
        votosNulos: 5,
        totalVotantesHabilitados: 1500,
        porcentajeEscrutinio: 25,
      },
      resultados: null,
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
    await expect.element(screen.getByText('1.500')).toBeInTheDocument()
    await expect
      .element(screen.getByText('Estado del comicio'))
      .toBeInTheDocument()
  })

  it('con comicio abierto muestra votos fiscalizados y % de escrutinio', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Participación en tiempo real'))
      .toBeInTheDocument()
    await expect.element(screen.getByText('375')).toBeInTheDocument()
    await expect.element(screen.getByText('25%')).toBeInTheDocument()
    await expect
      .element(screen.getByText('% del escrutinio'))
      .toBeInTheDocument()
  })

  it('con comicio cerrado muestra resultados por tipo de votación', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CERRADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      resultadosDefinitivos: true,
      snapshotCongelado: true,
    })
    mocks.obtenerEscrutinioPublico.mockResolvedValue({
      idEleccion: 6,
      estado: 'CERRADA',
      tipoVotacion: 'POR_LISTA',
      participacion: {
        votosFiscalizados: 1000,
        votosEnBlanco: 20,
        votosNulos: 10,
        totalVotantesHabilitados: 1500,
        porcentajeEscrutinio: 66.67,
      },
      resultados: {
        porLista: [
          {
            idLista: 1,
            nombre: 'Lista Azul',
            sigla: 'LA',
            color: '#2f6f9f',
            votos: 600,
            porcentaje: 60,
          },
        ],
        votosEnBlanco: 20,
        votosNulos: 10,
      },
    })

    const screen = await renderPage(6, 'resultados')

    await expect
      .element(screen.getByText('Escrutinio electoral'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Lista Azul (LA)'))
      .toBeInTheDocument()
    await expect.element(screen.getByText(/600 · 60%/)).toBeInTheDocument()
  })
})
