import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { DashboardPublicoPage } from './dashboard-publico-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  useTotalVotantesPublico: vi.fn(),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/padron/hooks/use-padron', () => ({
  useTotalVotantesPublico: mocks.useTotalVotantesPublico,
}))

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <DashboardPublicoPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('DashboardPublicoPage', () => {
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
        config: { headers: {} },
        data: { message: 'Comicio no encontrado' },
      })
    )

    const screen = await renderPage(99)

    await expect
      .element(screen.getByText(/Comicio no encontrado/i))
      .toBeInTheDocument()
  })

  it('expone el total de votantes habilitados en el dashboard público (UAT-01)', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CONFIGURADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useTotalVotantesPublico.mockReturnValue({
      data: { totalVotantesHabilitados: 1500 },
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Elección Centro de Estudiantes/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/En preparación/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Acceso público/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Total de votantes habilitados'))
      .toBeInTheDocument()
    await expect.element(screen.getByText('1.500')).toBeInTheDocument()
  })

  it('muestra el mismo indicador cuando el comicio está abierto (UAT-02)', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.useTotalVotantesPublico.mockReturnValue({
      data: { totalVotantesHabilitados: 1500 },
      isLoading: false,
      isError: false,
    })

    const screen = await renderPage(6)

    await expect.element(screen.getByText(/^Abierta$/i)).toBeInTheDocument()
    await expect.element(screen.getByText('1.500')).toBeInTheDocument()
  })
})
