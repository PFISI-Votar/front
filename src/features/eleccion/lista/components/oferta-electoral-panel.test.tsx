import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page, render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import * as eleccionApi from '@/features/eleccion/api/eleccion-api'
import * as configuracionApi from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import type { Eleccion } from '@/features/eleccion/data/schema'
import * as listaApi from '@/features/eleccion/lista/api/lista-api'
import { OfertaElectoralPanel } from './oferta-electoral-panel'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

const mockEleccionConfigurada: Eleccion = {
  idEleccion: 1,
  nombre: 'Elección Municipal 2025',
  descripcion: 'Elección de intendente',
  fechaInicio: '2025-10-15T08:00:00Z',
  fechaFin: '2025-10-15T18:00:00Z',
  estado: 'CONFIGURADA',
  configuracion: null,
}

describe('OfertaElectoralPanel - Abrir Comicio', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()

    // Mocks por defecto
    vi.spyOn(eleccionApi, 'obtenerEleccion').mockResolvedValue(
      mockEleccionConfigurada
    )
    vi.spyOn(listaApi, 'listarListas').mockResolvedValue([])
    vi.spyOn(
      configuracionApi,
      'obtenerConfiguracionDatosCandidato'
    ).mockResolvedValue({
      campos: [],
    } as any)
  })

  async function renderPanel() {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfertaElectoralPanel idEleccion={1} />
      </QueryClientProvider>
    )
  }

  it('muestra botón "Abrir comicio" cuando estado es CONFIGURADA', async () => {
    await renderPanel()

    await expect
      .element(page.getByRole('button', { name: 'Abrir comicio' }))
      .toBeInTheDocument()
  })

  it('no muestra botón "Abrir comicio" cuando estado es BORRADOR', async () => {
    vi.spyOn(eleccionApi, 'obtenerEleccion').mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'BORRADOR',
    })

    await renderPanel()

    const botonAbrir = page.queryByRole('button', { name: 'Abrir comicio' })
    expect(botonAbrir).toBeNull()
  })

  it('abre diálogo de confirmación al hacer clic en "Abrir comicio"', async () => {
    await renderPanel()

    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    await expect
      .element(page.getByRole('heading', { name: '¿Abrir el comicio?' }))
      .toBeInTheDocument()
  })

  it('muestra alerta crítica UAT-02 cuando hay error 412', async () => {
    vi.spyOn(eleccionApi, 'abrirEleccion').mockRejectedValue({
      response: {
        status: 412,
        data: {
          message:
            'Fallo de Precondición: Raíz de Merkle no detectada en la red descentralizada. Estado actual del árbol: CONSOLIDADO',
        },
      },
    })

    await renderPanel()

    // Abrir diálogo
    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    // Confirmar apertura
    const confirmButton = page.getByRole('button', { name: 'Sí, abrir comicio' })
    await userEvent.click(confirmButton)

    // Verificar alerta crítica con texto UAT-02 exacto
    await expect
      .element(
        page.getByText(
          'Fallo de Precondición: Raíz de Merkle no detectada en la red descentralizada'
        )
      )
      .toBeInTheDocument()
  })

  it('limpia error 412 al confirmar nuevamente tras fallo', async () => {
    vi.spyOn(eleccionApi, 'abrirEleccion')
      .mockRejectedValueOnce({
        response: {
          status: 412,
          data: {
            message: 'Error de Merkle',
          },
        },
      })
      .mockResolvedValueOnce({
        idEleccion: 1,
        estado: 'ABIERTA',
        modo: 'MANUAL',
      } as any)

    await renderPanel()

    // Primera apertura con error
    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', { name: 'Sí, abrir comicio' })
    await userEvent.click(confirmButton)

    // Verificar que se muestra el error
    await expect
      .element(page.getByText('Error de Merkle'))
      .toBeInTheDocument()

    // Abrir diálogo nuevamente
    await userEvent.click(abrirButton)

    // El error debe limpiarse al confirmar nuevamente
    await userEvent.click(confirmButton)

    const errorMerkle = page.queryByText('Error de Merkle')
    expect(errorMerkle).toBeNull()
  })

  it('actualiza estado tras apertura exitosa', async () => {
    const abrirEleccionSpy = vi
      .spyOn(eleccionApi, 'abrirEleccion')
      .mockResolvedValue({
        idEleccion: 1,
        estado: 'ABIERTA',
        modo: 'MANUAL',
      } as any)

    await renderPanel()

    // Abrir diálogo
    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    // Confirmar apertura
    const confirmButton = page.getByRole('button', { name: 'Sí, abrir comicio' })
    await userEvent.click(confirmButton)

    // Verificar que se llamó a la API
    expect(abrirEleccionSpy).toHaveBeenCalledWith(1)
  })

  it('muestra texto de precondiciones en diálogo de confirmación', async () => {
    await renderPanel()

    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    await expect
      .element(page.getByText(/sincronizará el estado con la blockchain/))
      .toBeInTheDocument()
    await expect
      .element(page.getByText(/padrón cargado, Merkle publicado on-chain/))
      .toBeInTheDocument()
  })
})
