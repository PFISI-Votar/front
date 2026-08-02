import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ConfiguracionVotoNuloPanel } from '@/features/eleccion/configuracion-comicio/components/configuracion-voto-nulo-panel'
import type { ConfiguracionVotoNulo } from '@/features/eleccion/configuracion-comicio/data/schema'

const obtenerConfiguracionVotoNuloMock = vi.fn()
const guardarConfiguracionVotoNuloMock = vi.fn()

vi.mock(
  '@/features/eleccion/configuracion-comicio/api/configuracion-voto-nulo-api',
  () => ({
    obtenerConfiguracionVotoNulo: (...args: unknown[]) =>
      obtenerConfiguracionVotoNuloMock(...args),
    guardarConfiguracionVotoNulo: (...args: unknown[]) =>
      guardarConfiguracionVotoNuloMock(...args),
  })
)

const defaultConfig: ConfiguracionVotoNulo = {
  idEleccion: 1,
  permitirVotoNulo: true,
  editable: true,
}

const renderPanel = async (isEditable = true) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfiguracionVotoNuloPanel idEleccion={1} isEditable={isEditable} />
    </QueryClientProvider>
  )
}

describe('ConfiguracionVotoNuloPanel (VOTAR-443)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obtenerConfiguracionVotoNuloMock.mockResolvedValue({ ...defaultConfig })
    guardarConfiguracionVotoNuloMock.mockResolvedValue({ ...defaultConfig })
  })

  it('el switch refleja el valor persistido (habilitado)', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de voto nulo/i })
    )

    const toggle = page.getByLabelText(/Permitir anular el voto/i)
    await expect.element(toggle).toBeChecked()
  })

  it('deshabilita el voto nulo y lo guarda', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de voto nulo/i })
    )

    const toggle = page.getByLabelText(/Permitir anular el voto/i)
    await userEvent.click(toggle)
    await expect.element(toggle).not.toBeChecked()

    await userEvent.click(
      page.getByRole('button', {
        name: /Guardar configuración de voto nulo/i,
      })
    )
    expect(guardarConfiguracionVotoNuloMock).toHaveBeenCalledWith(1, {
      permitirVotoNulo: false,
    })
  })

  it('modo lectura cuando isEditable=false', async () => {
    await renderPanel(false)
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de voto nulo/i })
    )

    await expect.element(page.getByText(/Solo lectura/i)).toBeInTheDocument()
    await expect
      .element(
        page.getByRole('button', {
          name: /Guardar configuración de voto nulo/i,
        })
      )
      .not.toBeInTheDocument()
  })

  it('modo lectura cuando el comicio ya no está en BORRADOR', async () => {
    obtenerConfiguracionVotoNuloMock.mockResolvedValue({
      ...defaultConfig,
      editable: false,
    })
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de voto nulo/i })
    )

    const toggle = page.getByLabelText(/Permitir anular el voto/i)
    await expect.element(toggle).toBeDisabled()
  })
})
