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
  minIntervaloSegundos: 0,
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

  it('fuerza max votos a 1 cuando re-voto está off', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    const maxInput = page.getByLabelText(/Máximo de sufragios por votante/i)
    await expect.element(maxInput).toHaveValue(1)
  })

  it('VOTAR-324 UAT-01: acepta 5 (habilita re-voto) y, al cambiar a 1, lo deshabilita', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    const maxInput = page.getByLabelText(/Máximo de sufragios por votante/i)
    await userEvent.fill(maxInput, '5')
    await expect.element(maxInput).toHaveValue(5)

    await userEvent.click(
      page.getByRole('button', { name: /Guardar política de re-voto/i })
    )
    expect(guardarConfiguracionRevotoMock).toHaveBeenCalledWith(1, {
      permitirVotoMultiple: true,
      maxVotosPorVotante: 5,
      minIntervaloSegundos: 0,
    })

    await userEvent.fill(maxInput, '1')
    await expect.element(maxInput).toHaveValue(1)
    await expect.element(maxInput).toBeEnabled()

    await userEvent.click(
      page.getByRole('button', { name: /Guardar política de re-voto/i })
    )
    expect(guardarConfiguracionRevotoMock).toHaveBeenCalledWith(1, {
      permitirVotoMultiple: false,
    })
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

  it('VOTAR-325: el intervalo mínimo está deshabilitado mientras el re-voto está off', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    const intervaloInput = page.getByLabelText(
      /Intervalo mínimo entre sufragios/i
    )
    await expect.element(intervaloInput).toHaveValue(0)
    await expect.element(intervaloInput).toBeDisabled()
  })

  it('VOTAR-325: habilita y envía minIntervaloSegundos junto con el re-voto', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', { name: /Mostrar configuración de re-voto/i })
    )

    const maxInput = page.getByLabelText(/Máximo de sufragios por votante/i)
    await userEvent.fill(maxInput, '3')

    const intervaloInput = page.getByLabelText(
      /Intervalo mínimo entre sufragios/i
    )
    await expect.element(intervaloInput).toBeEnabled()
    await userEvent.fill(intervaloInput, '300')

    await userEvent.click(
      page.getByRole('button', { name: /Guardar política de re-voto/i })
    )
    expect(guardarConfiguracionRevotoMock).toHaveBeenCalledWith(1, {
      permitirVotoMultiple: true,
      maxVotosPorVotante: 3,
      minIntervaloSegundos: 300,
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
