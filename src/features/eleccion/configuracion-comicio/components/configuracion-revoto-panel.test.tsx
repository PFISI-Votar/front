import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ConfiguracionRevotoPanel } from '@/features/eleccion/configuracion-comicio/components/configuracion-revoto-panel'
import type { ConfiguracionRevoto } from '@/features/eleccion/configuracion-comicio/data/schema'

const obtenerConfiguracionRevotoMock = vi.fn()
const guardarConfiguracionRevotoMock = vi.fn()

vi.mock(
  '@/features/eleccion/configuracion-comicio/api/configuracion-revoto-api',
  () => ({
    obtenerConfiguracionRevoto: (...args: unknown[]) =>
      obtenerConfiguracionRevotoMock(...args),
    guardarConfiguracionRevoto: (...args: unknown[]) =>
      guardarConfiguracionRevotoMock(...args),
  })
)

const defaultConfig: ConfiguracionRevoto = {
  idEleccion: 1,
  permitirVotoMultiple: false,
  maxVotosPorVotante: 1,
  politicaRevoto: 'DISABLED',
  editable: true,
}

const renderPanel = async (isEditable = true) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfiguracionRevotoPanel idEleccion={1} isEditable={isEditable} />
    </QueryClientProvider>
  )
}

describe('ConfiguracionRevotoPanel (VOTAR-323)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obtenerConfiguracionRevotoMock.mockResolvedValue({ ...defaultConfig })
    guardarConfiguracionRevotoMock.mockResolvedValue({ ...defaultConfig })
  })

  it('UAT-01: deshabilita max votos cuando re-voto está off', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    const maxInput = page.getByLabelText(/Máximo de sufragios por votante/i)
    await expect.element(maxInput).toBeDisabled()
  })

  it('envía solo permitirVotoMultiple=false al guardar con re-voto off', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )
    await userEvent.click(
      page.getByRole('button', { name: /Guardar política de re-voto/i })
    )

    expect(guardarConfiguracionRevotoMock).toHaveBeenCalledWith(1, {
      permitirVotoMultiple: false,
    })
  })

  it('modo lectura cuando isEditable=false', async () => {
    await renderPanel(false)
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    await expect.element(page.getByText(/Solo lectura/i)).toBeInTheDocument()
    await expect
      .element(
        page.getByRole('button', { name: /Guardar política de re-voto/i })
      )
      .not.toBeInTheDocument()
  })
})
