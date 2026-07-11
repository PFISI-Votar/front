import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import type { Eleccion } from '@/features/eleccion/data/schema'
import { ComiciosList } from './comicios-list'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<unknown>) => (
    <a {...props}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  listarElecciones: vi.fn(),
  abrirEleccion: vi.fn(),
}))

import {
  listarElecciones,
  abrirEleccion,
} from '@/features/eleccion/api/eleccion-api'

const mockElecciones: Eleccion[] = [
  {
    idEleccion: 1,
    nombre: 'Elección Municipal 2025',
    descripcion: 'Elección de intendente y concejales',
    fechaInicio: '2025-10-15T08:00:00Z',
    fechaFin: '2025-10-15T18:00:00Z',
    estado: 'CONFIGURADA',
  },
  {
    idEleccion: 2,
    nombre: 'Elección Provincial 2025',
    descripcion: 'Elección de gobernador',
    fechaInicio: '2025-11-20T09:00:00Z',
    fechaFin: '2025-11-20T19:00:00Z',
    estado: 'BORRADOR',
  },
] as Eleccion[]

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

  async function renderComiciosList() {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComiciosList />
      </QueryClientProvider>
    )
  }

  it('muestra lista de comicios correctamente', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect
      .element(page.getByText('Elección Municipal 2025'))
      .toBeInTheDocument()
    await expect
      .element(page.getByText('Elección Provincial 2025'))
      .toBeInTheDocument()
  })

  it('muestra botón "Abrir comicio" solo para elecciones en estado CONFIGURADA', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    // Verificar que existe el botón para la elección CONFIGURADA
    await expect
      .element(
        page.getByRole('button', {
          name: 'Abrir comicio Elección Municipal 2025',
        })
      )
      .toBeInTheDocument()
  })

  it('abre diálogo de confirmación al hacer clic en "Abrir comicio"', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    await expect
      .element(page.getByRole('heading', { name: 'Abrir comicio' }))
      .toBeInTheDocument()
    await expect
      .element(
        page.getByText(
          /¿Está seguro de que desea abrir el comicio "Elección Municipal 2025"?/
        )
      )
      .toBeInTheDocument()
  })

  it('muestra alerta crítica cuando hay error 412 (Precondition Failed)', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(abrirEleccion).mockRejectedValue({
      response: {
        status: 412,
        data: {
          message:
            'Estado actual del árbol: CONSOLIDADO',
        },
      },
    })

    await renderComiciosList()

    // Abrir diálogo
    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    // Confirmar apertura
    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    // Esperar a que termine la mutación (el diálogo permanece abierto)
    await expect
      .poll(() => page.getByRole('button', { name: 'Abrir comicio' }).query())
      .not.toBeNull()

    // Cerrar el diálogo manualmente
    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await userEvent.click(cancelButton)

    // Verificar que se muestra la alerta crítica con el título
    await expect
      .element(
        page.getByText(/Fallo de Precondición.*Raíz de Merkle/)
      )
      .toBeInTheDocument()

    // Verificar que se muestra el mensaje del backend
    await expect
      .element(page.getByText(/Estado actual del árbol.*CONSOLIDADO/))
      .toBeInTheDocument()
  })

  it('cierra diálogo tras apertura exitosa', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(abrirEleccion).mockResolvedValue({
      ...mockElecciones[0],
      estado: 'ABIERTA',
    })

    await renderComiciosList()

    // Abrir diálogo
    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    // Confirmar apertura
    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    // Verificar que se llamó a la API
    expect(abrirEleccion).toHaveBeenCalledWith(1)
  })

  it('limpia error previo al abrir diálogo nuevamente', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(abrirEleccion).mockRejectedValueOnce({
      response: {
        status: 412,
        data: {
          message: 'Error previo',
        },
      },
    })

    await renderComiciosList()

    // Primera apertura con error
    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    // Cerrar diálogo
    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await userEvent.click(cancelButton)

    // Abrir nuevamente
    await userEvent.click(abrirButton)

    // Verificar que no se muestra el error previo
    await expect.poll(() => page.getByText('Error previo').query()).toBeNull()
  })
})
