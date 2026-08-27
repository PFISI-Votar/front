import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { VisibilidadDashboardPanel } from '@/features/eleccion/configuracion-comicio/components/visibilidad-dashboard-panel'
import type { VisibilidadDashboard } from '@/features/eleccion/configuracion-comicio/data/schema'

const obtenerVisibilidadDashboardMock = vi.fn()
const guardarVisibilidadDashboardMock = vi.fn()

vi.mock(
  '@/features/eleccion/configuracion-comicio/api/visibilidad-dashboard-api',
  () => ({
    obtenerVisibilidadDashboard: (...args: unknown[]) =>
      obtenerVisibilidadDashboardMock(...args),
    guardarVisibilidadDashboard: (...args: unknown[]) =>
      guardarVisibilidadDashboardMock(...args),
  })
)

const defaultConfig: VisibilidadDashboard = {
  idEleccion: 1,
  mostrarResultados: true,
  mostrarParticipacion: true,
  mostrarRevoto: true,
  mostrarTransacciones: true,
  editable: true,
}

const renderPanel = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <VisibilidadDashboardPanel idEleccion={1} />
    </QueryClientProvider>
  )
}

const abrirPanel = async () => {
  await userEvent.click(
    page.getByRole('button', {
      name: /Mostrar configuración de visibilidad del dashboard público/i,
    })
  )
}

describe('VisibilidadDashboardPanel (VOTAR-459)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obtenerVisibilidadDashboardMock.mockResolvedValue({ ...defaultConfig })
    guardarVisibilidadDashboardMock.mockResolvedValue({ ...defaultConfig })
  })

  it('renderiza los 4 switches reflejando el valor persistido', async () => {
    await renderPanel()
    await abrirPanel()

    await expect
      .element(page.getByLabelText(/Mostrar solapa Resultados/i))
      .toBeChecked()
    await expect
      .element(page.getByLabelText(/Mostrar solapa Participación/i))
      .toBeChecked()
    await expect
      .element(page.getByLabelText(/Mostrar solapa Re-voto/i))
      .toBeChecked()
    await expect
      .element(page.getByLabelText(/Mostrar solapa Transacciones/i))
      .toBeChecked()
  })

  it('oculta Resultados y Participación y guarda el payload completo', async () => {
    await renderPanel()
    await abrirPanel()

    await userEvent.click(page.getByLabelText(/Mostrar solapa Resultados/i))
    await userEvent.click(page.getByLabelText(/Mostrar solapa Participación/i))

    await userEvent.click(
      page.getByRole('button', {
        name: /Guardar configuración de visibilidad del dashboard público/i,
      })
    )

    expect(guardarVisibilidadDashboardMock).toHaveBeenCalledWith(1, {
      mostrarResultados: false,
      mostrarParticipacion: false,
      mostrarRevoto: true,
      mostrarTransacciones: true,
    })
  })

  it('modo lectura cuando el backend indica editable=false (comicio ABIERTA)', async () => {
    obtenerVisibilidadDashboardMock.mockResolvedValue({
      ...defaultConfig,
      editable: false,
    })
    await renderPanel()
    await abrirPanel()

    await expect.element(page.getByText(/Solo lectura/i)).toBeInTheDocument()
    await expect
      .element(page.getByLabelText(/Mostrar solapa Resultados/i))
      .toBeDisabled()
    await expect
      .element(
        page.getByRole('button', {
          name: /Guardar configuración de visibilidad del dashboard público/i,
        })
      )
      .not.toBeInTheDocument()
  })
})
