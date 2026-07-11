import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, waitFor } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { ComiciosList } from './comicios-list'
import * as eleccionApi from '@/features/eleccion/api/eleccion-api'
import type { Eleccion } from '@/features/eleccion/data/schema'

// Mock del router
const routeTree = {
  id: '__root__',
  path: '/',
  component: () => null,
}

const createTestRouter = () => {
  const history = createMemoryHistory({ initialEntries: ['/'] })
  return createRouter({ routeTree, history })
}

const mockElecciones: Eleccion[] = [
  {
    idEleccion: 1,
    nombre: 'Elección Municipal 2025',
    descripcion: 'Elección de intendente y concejales',
    fechaInicio: new Date('2025-10-15T08:00:00Z'),
    fechaFin: new Date('2025-10-15T18:00:00Z'),
    estado: 'CONFIGURADA',
    configuracion: null,
  },
  {
    idEleccion: 2,
    nombre: 'Elección Provincial 2025',
    descripcion: 'Elección de gobernador',
    fechaInicio: new Date('2025-11-20T09:00:00Z'),
    fechaFin: new Date('2025-11-20T19:00:00Z'),
    estado: 'BORRADOR',
    configuracion: null,
  },
]

describe('ComiciosList', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const renderWithProviders = async (component: React.ReactElement) => {
    const router = createTestRouter()
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>{component}</RouterProvider>
      </QueryClientProvider>
    )
  }

  it('muestra lista de comicios correctamente', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)

    const { getByText } = await renderWithProviders(<ComiciosList />)

    await waitFor(async () => {
      await expect.element(getByText('Elección Municipal 2025')).toBeInTheDocument()
      await expect.element(getByText('Elección Provincial 2025')).toBeInTheDocument()
    })
  })

  it('muestra botón "Abrir comicio" solo para elecciones en estado CONFIGURADA', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)

    const { getAllByRole } = await renderWithProviders(<ComiciosList />)

    await waitFor(async () => {
      const abrirButtons = getAllByRole('button', { name: /Abrir comicio/i })
      expect(abrirButtons).toHaveLength(1) // Solo la elección CONFIGURADA
    })
  })

  it('abre diálogo de confirmación al hacer clic en "Abrir comicio"', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)

    const { getByRole, getByText } = await renderWithProviders(<ComiciosList />)

    await waitFor(async () => {
      const abrirButton = getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
      await userEvent.click(abrirButton)
    })

    await expect
      .element(getByRole('heading', { name: 'Abrir comicio' }))
      .toBeInTheDocument()
    await expect
      .element(
        getByText(/¿Está seguro de que desea abrir el comicio "Elección Municipal 2025"?/)
      )
      .toBeInTheDocument()
  })

  it('muestra alerta crítica cuando hay error 412 (Precondition Failed)', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)
    vi.spyOn(eleccionApi, 'abrirEleccion').mockRejectedValue({
      response: {
        status: 412,
        data: {
          message:
            'Fallo de Precondición: Raíz de Merkle no detectada en la red descentralizada',
        },
      },
    })

    const { getByRole, getByText } = await renderWithProviders(<ComiciosList />)

    // Abrir diálogo
    await waitFor(async () => {
      const abrirButton = getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
      await userEvent.click(abrirButton)
    })

    // Confirmar apertura
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Verificar que se muestra la alerta crítica
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

  it('cierra diálogo y actualiza lista tras apertura exitosa', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)
    vi.spyOn(eleccionApi, 'abrirEleccion').mockResolvedValue({
      idEleccion: 1,
      estado: 'ABIERTA',
      fechaApertura: new Date(),
      modo: 'MANUAL',
    })

    const { getByRole, queryByRole } = await renderWithProviders(<ComiciosList />)

    // Abrir diálogo
    await waitFor(async () => {
      const abrirButton = getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
      await userEvent.click(abrirButton)
    })

    // Confirmar apertura
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Verificar que el diálogo se cierra
    await waitFor(async () => {
      expect(queryByRole('heading', { name: 'Abrir comicio' })).toBe(null)
    })

    expect(eleccionApi.abrirEleccion).toHaveBeenCalledWith(1)
  })

  it('limpia error previo al abrir diálogo nuevamente', async () => {
    vi.spyOn(eleccionApi, 'listarElecciones').mockResolvedValue(mockElecciones)
    vi.spyOn(eleccionApi, 'abrirEleccion').mockRejectedValueOnce({
      response: {
        status: 412,
        data: {
          message: 'Error previo',
        },
      },
    })

    const { getByRole, queryByText } = await renderWithProviders(<ComiciosList />)

    // Primera apertura con error
    await waitFor(async () => {
      const abrirButton = getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
      await userEvent.click(abrirButton)
    })

    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Abrir comicio' })
      await userEvent.click(confirmButton)
    })

    // Cerrar diálogo
    await waitFor(async () => {
      const cancelButton = getByRole('button', { name: 'Cancelar' })
      await userEvent.click(cancelButton)
    })

    // Abrir nuevamente
    await waitFor(async () => {
      const abrirButton = getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
      await userEvent.click(abrirButton)
    })

    // Verificar que no se muestra el error previo
    expect(queryByText('Error previo')).toBe(null)
  })
})
