import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ConfiguracionMensajeBudPanel } from '@/features/eleccion/configuracion-comicio/components/configuracion-mensaje-bud-panel'
import type { MensajeBud } from '@/features/eleccion/configuracion-comicio/data/schema'
import { DEFAULT_BUD_LOGIN_OBSERVACION } from '@/features/voto/components/bud-login-screen'

const obtenerMensajeBudMock = vi.fn()
const guardarMensajeBudMock = vi.fn()

vi.mock(
  '@/features/eleccion/configuracion-comicio/api/mensaje-bud-api',
  () => ({
    obtenerMensajeBud: (...args: unknown[]) => obtenerMensajeBudMock(...args),
    guardarMensajeBud: (...args: unknown[]) => guardarMensajeBudMock(...args),
  })
)

const defaultMensaje: MensajeBud = {
  idEleccion: 1,
  observacionLogin: DEFAULT_BUD_LOGIN_OBSERVACION,
  editable: true,
}

const renderPanel = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfiguracionMensajeBudPanel idEleccion={1} />
    </QueryClientProvider>
  )
}

describe('ConfiguracionMensajeBudPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obtenerMensajeBudMock.mockResolvedValue({ ...defaultMensaje })
    guardarMensajeBudMock.mockResolvedValue({ ...defaultMensaje })
  })

  it('muestra el campo de texto con el mensaje persistido', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', {
        name: /Mostrar configuración de mensaje del BUD/i,
      })
    )

    const textarea = page.getByRole('textbox', {
      name: /Mensaje para los votantes/i,
    })
    await expect.element(textarea).toHaveValue(DEFAULT_BUD_LOGIN_OBSERVACION)
  })

  it('permite modificar y guardar el mensaje del BUD', async () => {
    await renderPanel()
    await userEvent.click(
      page.getByRole('button', {
        name: /Mostrar configuración de mensaje del BUD/i,
      })
    )

    const textarea = page.getByRole('textbox', {
      name: /Mensaje para los votantes/i,
    })
    await userEvent.clear(textarea)
    await userEvent.fill(
      textarea,
      'Atención alumnos: ingresen con su legajo de autogestión.'
    )

    await userEvent.click(
      page.getByRole('button', {
        name: /Guardar mensaje del login del BUD/i,
      })
    )

    expect(guardarMensajeBudMock).toHaveBeenCalledWith(1, {
      observacionLogin:
        'Atención alumnos: ingresen con su legajo de autogestión.',
    })
  })

  it('permite restablecer el mensaje por defecto', async () => {
    obtenerMensajeBudMock.mockResolvedValue({
      idEleccion: 1,
      observacionLogin: 'Texto personalizado previo',
      editable: true,
    })

    await renderPanel()
    await userEvent.click(
      page.getByRole('button', {
        name: /Mostrar configuración de mensaje del BUD/i,
      })
    )

    await userEvent.click(
      page.getByRole('button', {
        name: /Restablecer texto por defecto/i,
      })
    )

    const textarea = page.getByRole('textbox', {
      name: /Mensaje para los votantes/i,
    })
    await expect.element(textarea).toHaveValue(DEFAULT_BUD_LOGIN_OBSERVACION)
  })

  it('muestra aviso de solo lectura si editable=false (archivado)', async () => {
    obtenerMensajeBudMock.mockResolvedValue({
      idEleccion: 1,
      observacionLogin: DEFAULT_BUD_LOGIN_OBSERVACION,
      editable: false,
    })

    await renderPanel()
    await userEvent.click(
      page.getByRole('button', {
        name: /Mostrar configuración de mensaje del BUD/i,
      })
    )

    await expect
      .element(
        page.getByText(/El comicio está archivado y no admite modificaciones/i)
      )
      .toBeInTheDocument()
    await expect
      .element(
        page.getByRole('button', {
          name: /Guardar mensaje del login del BUD/i,
        })
      )
      .not.toBeInTheDocument()
  })
})
