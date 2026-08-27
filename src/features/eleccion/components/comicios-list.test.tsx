import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import {
  listarElecciones,
  abrirEleccion,
  archivarEleccion,
  eliminarEleccion,
} from '@/features/eleccion/api/eleccion-api'
import type { Eleccion } from '@/features/eleccion/data/schema'
import { oficializarEleccion } from '@/features/eleccion/lista/api/lista-api'
import { ComiciosList } from './comicios-list'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: React.PropsWithChildren<
    Record<string, unknown> & {
      to?: string
      params?: { idEleccion?: string }
    }
  >) => (
    <a
      href={
        typeof to === 'string' && params?.idEleccion
          ? String(to).replace('$idEleccion', params.idEleccion)
          : '#'
      }
      {...props}
    >
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  listarElecciones: vi.fn(),
  abrirEleccion: vi.fn(),
  cerrarEleccion: vi.fn(),
  archivarEleccion: vi.fn(),
  eliminarEleccion: vi.fn(),
  pausarEleccion: vi.fn(),
  reanudarEleccion: vi.fn(),
  obtenerEstadoPausa: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/features/eleccion/lista/api/lista-api', () => ({
  oficializarEleccion: vi.fn(),
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

const mockComicioCerrado: Eleccion = {
  idEleccion: 3,
  nombre: 'Elección Cerrada 2025',
  descripcion: 'Elección ya finalizada',
  fechaInicio: '2025-05-15T08:00:00Z',
  fechaFin: '2025-05-15T18:00:00Z',
  estado: 'CERRADA',
} as Eleccion

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

  it('alinea iconos a la izquierda en el conjunto de botones de acción', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect
      .element(page.getByText('Elección Provincial 2025'))
      .toBeInTheDocument()

    const actionLabels = [
      'Ver padrón',
      'Dashboard público',
      'Abrir BUD',
      'Editar',
      'Abrir comicio',
    ]
    for (const label of actionLabels) {
      const control = page.getByText(label, { exact: true }).first()
      await expect.element(control).toBeInTheDocument()
      const el = control.element().closest('a,button')
      expect(el).not.toBeNull()
      expect(el?.querySelector('svg')).not.toBeNull()
      expect(el?.firstElementChild?.tagName.toLowerCase()).toBe('svg')
    }
  })

  it('muestra ventana electoral y estado legible en cada comicio', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect.element(page.getByText('En preparación')).toBeInTheDocument()
    await expect.element(page.getByText('Borrador')).toBeInTheDocument()
    expect(page.getByText(/Apertura.*Cierre/).all()).toHaveLength(2)
  })

  it('no muestra el botón "Ver oferta" porque la card navega a la oferta', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect
      .element(page.getByText('Elección Municipal 2025'))
      .toBeInTheDocument()
    expect(page.getByText('Ver oferta').query()).toBeNull()
  })

  it('navega a la oferta al hacer clic en la card', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    const card = page.getByRole('link', {
      name: 'Ver oferta de Elección Municipal 2025',
    })
    await userEvent.click(card)

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/comicios/$idEleccion/oferta',
      params: { idEleccion: '1' },
    })
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

  it('muestra "Oficializar" y "Eliminar" solo en BORRADOR', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect
      .element(
        page.getByRole('button', {
          name: 'Oficializar comicio Elección Provincial 2025',
        })
      )
      .toBeInTheDocument()
    await expect
      .element(
        page.getByRole('button', {
          name: 'Eliminar comicio Elección Provincial 2025',
        })
      )
      .toBeInTheDocument()
    await expect
      .element(
        page.getByRole('link', {
          name: 'Editar Elección Provincial 2025',
        })
      )
      .toBeInTheDocument()
    expect(
      page
        .getByRole('button', {
          name: 'Oficializar comicio Elección Municipal 2025',
        })
        .query()
    ).toBeNull()
    expect(
      page
        .getByRole('button', {
          name: 'Eliminar comicio Elección Municipal 2025',
        })
        .query()
    ).toBeNull()
  })

  it('ordena Ver padrón, Dashboard, BUD y luego Oficializar en BORRADOR', async () => {
    vi.mocked(listarElecciones).mockResolvedValue([mockElecciones[1]])

    await renderComiciosList()

    const padron = page.getByRole('link', {
      name: 'Ver padrón de Elección Provincial 2025',
    })
    const dashboard = page.getByRole('link', {
      name: 'Ver dashboard público de Elección Provincial 2025',
    })
    const bud = page.getByRole('link', {
      name: 'Abrir BUD de Elección Provincial 2025',
    })
    const oficializar = page.getByRole('button', {
      name: 'Oficializar comicio Elección Provincial 2025',
    })

    await expect.element(padron).toBeInTheDocument()
    await expect.element(dashboard).toBeInTheDocument()
    await expect.element(bud).toBeInTheDocument()
    await expect.element(oficializar).toBeInTheDocument()

    const padronNode = padron.element()
    const dashboardNode = dashboard.element()
    const budNode = bud.element()
    const oficializarNode = oficializar.element()
    expect(
      padronNode.compareDocumentPosition(dashboardNode) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      dashboardNode.compareDocumentPosition(budNode) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      budNode.compareDocumentPosition(oficializarNode) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('expone enlace Abrir BUD y dashboard público de cada comicio', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await expect
      .element(page.getByText('Elección Municipal 2025'))
      .toBeInTheDocument()
    expect(page.getByText('Abrir BUD').all()).toHaveLength(2)
    expect(page.getByText('Dashboard público').all()).toHaveLength(2)
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

  it('oficializa un comicio en BORRADOR tras confirmar', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(oficializarEleccion).mockResolvedValue({
      idEleccion: 2,
      estado: 'CONFIGURADA',
      mapeo: [],
    })

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Oficializar comicio Elección Provincial 2025',
      })
    )
    await userEvent.click(
      page.getByRole('button', { name: 'Sí, oficializar comicio' })
    )

    await vi.waitFor(() => {
      expect(oficializarEleccion).toHaveBeenCalledWith(2)
    })
  })

  it('cierra el diálogo de oficializar de inmediato y continúa en segundo plano', async () => {
    let resolveOficializar!: (value: {
      idEleccion: number
      estado: 'CONFIGURADA'
      mapeo: []
    }) => void
    const pendingOficializar = new Promise<{
      idEleccion: number
      estado: 'CONFIGURADA'
      mapeo: []
    }>((resolve) => {
      resolveOficializar = resolve
    })

    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(oficializarEleccion).mockReturnValue(pendingOficializar)

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Oficializar comicio Elección Provincial 2025',
      })
    )
    await userEvent.click(
      page.getByRole('button', { name: 'Sí, oficializar comicio' })
    )

    await expect
      .poll(() => page.getByRole('heading', { name: '¿Oficializar el comicio?' }).query())
      .toBeNull()

    resolveOficializar({
      idEleccion: 2,
      estado: 'CONFIGURADA',
      mapeo: [],
    })

    await vi.waitFor(() => {
      expect(oficializarEleccion).toHaveBeenCalledWith(2)
    })
  })

  it('elimina un comicio en BORRADOR tras confirmar con el nombre exacto', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(eliminarEleccion).mockResolvedValue(undefined)

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Eliminar comicio Elección Provincial 2025',
      })
    )

    const confirmButton = page.getByRole('button', {
      name: 'Sí, eliminar comicio',
    })
    await expect.element(confirmButton).toBeDisabled()

    await userEvent.fill(
      page.getByRole('textbox', {
        name: 'Escribí Elección Provincial 2025 para confirmar',
      }),
      'Elección Provincial 2025'
    )
    await expect.element(confirmButton).toBeEnabled()
    await userEvent.click(confirmButton)

    await vi.waitFor(() => {
      expect(eliminarEleccion).toHaveBeenCalledWith(2)
    })
  })

  it('no elimina el comicio si el nombre de confirmación no coincide', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)
    vi.mocked(eliminarEleccion).mockResolvedValue(undefined)

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Eliminar comicio Elección Provincial 2025',
      })
    )

    await userEvent.fill(
      page.getByRole('textbox', {
        name: 'Escribí Elección Provincial 2025 para confirmar',
      }),
      'nombre incorrecto'
    )

    await expect
      .element(page.getByRole('button', { name: 'Sí, eliminar comicio' }))
      .toBeDisabled()
    expect(eliminarEleccion).not.toHaveBeenCalled()
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

  it('no navega a la oferta al hacer clic en un botón de acción', async () => {
    vi.mocked(listarElecciones).mockResolvedValue(mockElecciones)

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Abrir comicio Elección Municipal 2025',
      })
    )

    expect(navigateMock).not.toHaveBeenCalled()
    await expect
      .element(page.getByRole('heading', { name: 'Abrir comicio' }))
      .toBeInTheDocument()
  })

  it('muestra botón "Archivar Comicio" solo para elecciones en estado CERRADA', async () => {
    vi.mocked(listarElecciones).mockResolvedValue([
      ...mockElecciones,
      mockComicioCerrado,
    ])

    await renderComiciosList()

    await expect
      .element(
        page.getByRole('button', {
          name: 'Archivar comicio Elección Cerrada 2025',
        })
      )
      .toBeInTheDocument()
    expect(
      page
        .getByRole('button', {
          name: 'Archivar comicio Elección Municipal 2025',
        })
        .query()
    ).toBeNull()
  })

  it('archiva un comicio en CERRADA tras confirmar', async () => {
    vi.mocked(listarElecciones).mockResolvedValue([
      ...mockElecciones,
      mockComicioCerrado,
    ])
    vi.mocked(archivarEleccion).mockResolvedValue({
      ...mockComicioCerrado,
      estado: 'ARCHIVADA',
    })

    await renderComiciosList()

    await userEvent.click(
      page.getByRole('button', {
        name: 'Archivar comicio Elección Cerrada 2025',
      })
    )
    await expect
      .element(page.getByRole('heading', { name: '¿Archivar el comicio?' }))
      .toBeInTheDocument()

    await userEvent.click(
      page.getByRole('button', { name: 'Sí, archivar comicio' })
    )

    await vi.waitFor(() => {
      expect(archivarEleccion).toHaveBeenCalledWith(3)
    })
  })
})
