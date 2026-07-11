import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, waitFor } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import * as eleccionApi from '@/features/eleccion/api/eleccion-api'
import * as configuracionApi from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import type { Eleccion } from '@/features/eleccion/data/schema'
import * as listaApi from '@/features/eleccion/lista/api/lista-api'
import { OfertaElectoralPanel } from './oferta-electoral-panel'

const routeTree = {
  id: '__root__',
  path: '/',
  component: () => null,
}

const createTestRouter = () => {
  const history = createMemoryHistory({ initialEntries: ['/'] })
  return createRouter({ routeTree, history })
}

const mockEleccionConfigurada: Eleccion = {
  idEleccion: 1,
  nombre: 'Elección Municipal 2025',
  descripcion: 'Elección de intendente',
  fechaInicio: new Date('2025-10-15T08:00:00Z'),
  fechaFin: new Date('2025-10-15T18:00:00Z'),
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
      idConfiguracion: 1,
      campos: [],
    })
  })

  const renderWithProviders = async (component: React.ReactElement) => {
    const router = createTestRouter()
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>{component}</RouterProvider>
      </QueryClientProvider>
    )
  }

  it('muestra botón "Abrir comicio" cuando estado es CONFIGURADA', async () => {
    const { getByRole } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    await waitFor(async () => {
      await expect
        .element(getByRole('button', { name: 'Abrir comicio' }))
        .toBeInTheDocument()
    })
  })

  it('no muestra botón "Abrir comicio" cuando estado es BORRADOR', async () => {
    vi.spyOn(eleccionApi, 'obtenerEleccion').mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'BORRADOR',
    })

    const { queryByRole } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    await waitFor(() => {
      expect(queryByRole('button', { name: 'Abrir comicio' })).toBe(null)
    })
  })

  it('abre diálogo de confirmación al hacer clic en "Abrir comicio"', async () => {
    const { getByRole } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    await expect
      .element(getByRole('heading', { name: '¿Abrir el comicio?' }))
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

    const { getByRole, getByText } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    // Abrir diálogo
    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    // Confirmar apertura
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Sí, abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Verificar alerta crítica con texto UAT-02 exacto
    await waitFor(async () => {
      await expect
        .element(
          getByText(
            'Fallo de Precondición: Raíz de Merkle no detectada en la red descentralizada'
          )
        )
        .toBeInTheDocument()
    })
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
        fechaApertura: new Date(),
        modo: 'MANUAL',
      })

    const { getByRole, queryByText } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    // Primera apertura con error
    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Sí, abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Verificar que se muestra el error
    await waitFor(async () => {
      await expect.element(queryByText('Error de Merkle')).toBeInTheDocument()
    })

    // Abrir diálogo nuevamente
    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    // El error debe limpiarse al confirmar nuevamente
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Sí, abrir comicio' })
      await userEvent.click(confirmButton)
    })

    await waitFor(() => {
      expect(queryByText('Error de Merkle')).toBe(null)
    })
  })

  it('actualiza estado tras apertura exitosa', async () => {
    const abrirEleccionSpy = vi
      .spyOn(eleccionApi, 'abrirEleccion')
      .mockResolvedValue({
        idEleccion: 1,
        estado: 'ABIERTA',
        fechaApertura: new Date(),
        modo: 'MANUAL',
      })

    const { getByRole } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    // Abrir diálogo
    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    // Confirmar apertura
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Sí, abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Verificar que se llamó a la API
    await waitFor(() => {
      expect(abrirEleccionSpy).toHaveBeenCalledWith(1)
    })
  })

  it('muestra texto de precondiciones en diálogo de confirmación', async () => {
    const { getByRole, getByText } = await renderWithProviders(
      <OfertaElectoralPanel idEleccion={1} />
    )

    await waitFor(async () => {
      const abrirButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(abrirButton)
    })

    await expect
      .element(getByText(/sincronizará el estado con la blockchain/))
      .toBeInTheDocument()
    await expect
      .element(getByText(/padrón cargado, Merkle publicado on-chain/))
      .toBeInTheDocument()
  })
})
