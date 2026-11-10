import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ConfiguracionPopupAlertaPanel } from '@/features/eleccion/configuracion-comicio/components/configuracion-popup-alerta-panel'
import type { PopupAlerta } from '@/features/eleccion/configuracion-comicio/data/schema'

const obtenerPopupAlertaMock = vi.fn()
const guardarPopupAlertaMock = vi.fn()

vi.mock(
  '@/features/eleccion/configuracion-comicio/api/popup-alerta-api',
  () => ({
    obtenerPopupAlerta: (...args: unknown[]) => obtenerPopupAlertaMock(...args),
    guardarPopupAlerta: (...args: unknown[]) => guardarPopupAlertaMock(...args),
  })
)

const defaultConfig: PopupAlerta = {
  idEleccion: 1,
  habilitado: false,
  titulo: null,
  descripcion: null,
  editable: true,
}

const renderPanel = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ConfiguracionPopupAlertaPanel idEleccion={1} />
    </QueryClientProvider>
  )
  await userEvent.click(
    page.getByRole('button', {
      name: /Mostrar configuración del pop-up de alerta/i,
    })
  )
  return screen
}

const getTitulo = () =>
  page.getByRole('textbox', { name: /Título del pop-up/i })
const getDescripcion = () =>
  page.getByRole('textbox', { name: /Descripción del pop-up/i })
const getSwitch = () => page.getByLabelText(/Habilitar pop-up de alerta/i)
const getGuardar = () =>
  page.getByRole('button', { name: /Guardar pop-up de alerta/i })

describe('ConfiguracionPopupAlertaPanel (VOTAR-524)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obtenerPopupAlertaMock.mockResolvedValue({ ...defaultConfig })
    guardarPopupAlertaMock.mockResolvedValue({ ...defaultConfig })
  })

  it('deshabilitado por defecto: switch apagado y textos bloqueados', async () => {
    await renderPanel()

    await expect.element(getSwitch()).not.toBeChecked()
    await expect.element(getTitulo()).toBeDisabled()
    await expect.element(getDescripcion()).toBeDisabled()
  })

  it('refleja el estado persistido (habilitado con textos)', async () => {
    obtenerPopupAlertaMock.mockResolvedValue({
      ...defaultConfig,
      habilitado: true,
      titulo: 'Aviso importante',
      descripcion: 'Texto del aviso',
    })

    await renderPanel()

    await expect.element(getSwitch()).toBeChecked()
    await expect.element(getTitulo()).toHaveValue('Aviso importante')
    await expect.element(getDescripcion()).toHaveValue('Texto del aviso')
  })

  it('habilita, recorta espacios y guarda', async () => {
    await renderPanel()

    await userEvent.click(getSwitch())
    await userEvent.fill(getTitulo(), '  Aviso importante  ')
    await userEvent.fill(getDescripcion(), 'Texto del aviso')
    await userEvent.click(getGuardar())

    await vi.waitFor(() => {
      expect(guardarPopupAlertaMock).toHaveBeenCalledWith(1, {
        habilitado: true,
        titulo: 'Aviso importante',
        descripcion: 'Texto del aviso',
      })
    })
  })

  it('habilitado con campos vacíos muestra errores y no guarda', async () => {
    await renderPanel()

    await userEvent.click(getSwitch())
    await userEvent.click(getGuardar())

    await expect
      .element(page.getByText('El título es obligatorio'))
      .toBeInTheDocument()
    await expect
      .element(page.getByText('La descripción es obligatoria'))
      .toBeInTheDocument()
    expect(guardarPopupAlertaMock).not.toHaveBeenCalled()
  })

  it('un título de solo espacios no es válido', async () => {
    await renderPanel()

    await userEvent.click(getSwitch())
    await userEvent.fill(getTitulo(), '   ')
    await userEvent.fill(getDescripcion(), 'Texto del aviso')
    await userEvent.click(getGuardar())

    await expect
      .element(page.getByText('El título es obligatorio'))
      .toBeInTheDocument()
    expect(guardarPopupAlertaMock).not.toHaveBeenCalled()
  })

  it('rechaza un título que supera el largo máximo', async () => {
    await renderPanel()

    await userEvent.click(getSwitch())
    await userEvent.fill(getTitulo(), 'a'.repeat(101))
    await userEvent.fill(getDescripcion(), 'Texto del aviso')
    await userEvent.click(getGuardar())

    await expect
      .element(page.getByText('El título no puede superar los 100 caracteres'))
      .toBeInTheDocument()
    expect(guardarPopupAlertaMock).not.toHaveBeenCalled()
  })

  it('modo solo lectura si editable=false (archivado)', async () => {
    obtenerPopupAlertaMock.mockResolvedValue({
      ...defaultConfig,
      editable: false,
    })

    await renderPanel()

    await expect.element(page.getByText(/Solo lectura/i)).toBeInTheDocument()
    await expect.element(getSwitch()).toBeDisabled()
    await expect.element(getGuardar()).not.toBeInTheDocument()
  })
})
