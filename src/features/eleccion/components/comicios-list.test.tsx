import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import {
  listarElecciones,
  abrirEleccion,
} from '@/features/eleccion/api/eleccion-api'
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

vi.mock('@/features/eleccion/hooks/use-eleccion-websocket', () => ({
  useEleccionWebSocket: vi.fn(),
}))

const createPreconditionError = (message: string) =>
  new AxiosError(
    'Precondition Failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 412,
      statusText: 'Precondition Failed',
      headers: {},
      config: {} as never,
      data: { message },
    }
  )

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
    vi.mocked(abrirEleccion).mockRejectedValue(
      createPreconditionError('Estado actual del árbol: CONSOLIDADO')
    )

    await renderComiciosList()

    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    await vi.waitFor(() => {
      expect(abrirEleccion).toHaveBeenCalledWith(1)
    })

    await expect.poll(() => page.getByRole('dialog').query()).toBeNull()

    await expect
      .element(page.getByText(/Fallo de Precondición.*Raíz de Merkle/))
      .toBeInTheDocument()

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

    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    expect(abrirEleccion).toHaveBeenCalledWith(1)
  })

  it('limpia error previo al abrir diálogo nuevamente', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(abrirEleccion).mockRejectedValueOnce(
      createPreconditionError('Error previo')
    )

    await renderComiciosList()

    const abrirButton = page.getByRole('button', {
      name: 'Abrir comicio Elección Municipal 2025',
    })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(confirmButton)

    await expect.element(page.getByText('Error previo')).toBeInTheDocument()

    await userEvent.click(abrirButton)

    await expect.poll(() => page.getByText('Error previo').query()).toBeNull()
  })
})
