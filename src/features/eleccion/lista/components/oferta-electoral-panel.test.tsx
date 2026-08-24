import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import {
  obtenerEleccion,
  abrirEleccion,
  cerrarEleccion,
  eliminarEleccion,
} from '@/features/eleccion/api/eleccion-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import type { ConfiguracionDatosCandidatoResponse } from '@/features/eleccion/candidato/data/schema'
import type { Eleccion } from '@/features/eleccion/data/schema'
import {
  eliminarLista,
  listarListas,
  obtenerMapeoListas,
} from '@/features/eleccion/lista/api/lista-api'
import type { Lista } from '@/features/eleccion/lista/data/schema'
import { OfertaElectoralPanel } from './oferta-electoral-panel'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<unknown>) => (
    <a {...props}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  crearEleccion: vi.fn(),
  actualizarEleccion: vi.fn(),
  eliminarEleccion: vi.fn(),
  listarElecciones: vi.fn(),
  obtenerEleccion: vi.fn(),
  abrirEleccion: vi.fn(),
  cerrarEleccion: vi.fn(),
  archivarEleccion: vi.fn(),
  obtenerActaApertura: vi.fn(),
  obtenerActaCierre: vi.fn(),
  registrarHashActaCierre: vi.fn(),
  pausarEleccion: vi.fn(),
  reanudarEleccion: vi.fn(),
  obtenerEstadoPausa: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/features/eleccion/lista/api/lista-api', () => ({
  listarListas: vi.fn(),
  crearLista: vi.fn(),
  actualizarLista: vi.fn(),
  eliminarLista: vi.fn(),
  subirLogoLista: vi.fn(),
  eliminarLogoLista: vi.fn(),
  oficializarEleccion: vi.fn(),
  obtenerMapeoListas: vi.fn(),
}))

vi.mock(
  '@/features/eleccion/candidato/api/configuracion-datos-candidato-api',
  () => ({
    obtenerConfiguracionDatosCandidato: vi.fn(),
    guardarConfiguracionDatosCandidato: vi.fn(),
  })
)

vi.mock('@/features/eleccion/hooks/use-eleccion-websocket', () => ({
  useEleccionWebSocket: vi.fn(),
}))

vi.mock('@/features/padron/hooks/use-padron', () => ({
  usePadronResumen: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  }),
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

const mockEleccionConfigurada: Eleccion = {
  idEleccion: 1,
  nombre: 'Elección Municipal 2025',
  descripcion: 'Elección de intendente',
  fechaInicio: '2025-10-15T08:00:00Z',
  fechaFin: '2025-10-15T18:00:00Z',
  estado: 'CONFIGURADA',
} as Eleccion

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

    vi.mocked(obtenerEleccion).mockResolvedValue(mockEleccionConfigurada)
    vi.mocked(listarListas).mockResolvedValue([])
    vi.mocked(obtenerMapeoListas).mockResolvedValue([])
    vi.mocked(obtenerConfiguracionDatosCandidato).mockResolvedValue({
      idEleccion: 1,
      campos: [],
      editable: false,
      cantidadCandidatos: 0,
    } satisfies ConfiguracionDatosCandidatoResponse)
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
    vi.mocked(obtenerEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'BORRADOR',
    })

    await renderPanel()

    await expect
      .poll(() => page.getByRole('button', { name: 'Abrir comicio' }).query())
      .toBeNull()
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
    vi.mocked(abrirEleccion).mockRejectedValue(
      createPreconditionError('Estado actual del árbol: CONSOLIDADO')
    )

    await renderPanel()

    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', {
      name: 'Sí, abrir comicio',
    })
    await userEvent.click(confirmButton)

    await expect
      .element(page.getByText(/Fallo de Precondición.*Raíz de Merkle/))
      .toBeInTheDocument()
    await expect
      .element(page.getByText(/Estado actual del árbol.*CONSOLIDADO/))
      .toBeInTheDocument()
  })

  it('limpia error 412 al confirmar nuevamente tras fallo', async () => {
    vi.mocked(abrirEleccion)
      .mockRejectedValueOnce(createPreconditionError('Error de Merkle'))
      .mockResolvedValueOnce({
        ...mockEleccionConfigurada,
        estado: 'ABIERTA',
      })

    await renderPanel()

    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', {
      name: 'Sí, abrir comicio',
    })
    await userEvent.click(confirmButton)

    await expect.element(page.getByText('Error de Merkle')).toBeInTheDocument()

    await userEvent.click(abrirButton)
    await userEvent.click(confirmButton)

    await expect
      .poll(() => page.getByText('Error de Merkle').query())
      .toBeNull()
  })

  it('actualiza estado tras apertura exitosa', async () => {
    vi.mocked(abrirEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'ABIERTA',
    })

    await renderPanel()

    const abrirButton = page.getByRole('button', { name: 'Abrir comicio' })
    await userEvent.click(abrirButton)

    const confirmButton = page.getByRole('button', {
      name: 'Sí, abrir comicio',
    })
    await userEvent.click(confirmButton)

    expect(abrirEleccion).toHaveBeenCalledWith(1)
  })

  it('muestra ventana electoral cuando el comicio está configurado', async () => {
    await renderPanel()

    await expect.element(page.getByText(/Apertura.*Cierre/)).toBeInTheDocument()
  })

  it('muestra botón "Cerrar comicio" cuando estado es ABIERTA', async () => {
    vi.mocked(obtenerEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'ABIERTA',
    })

    await renderPanel()

    await expect
      .element(page.getByRole('button', { name: 'Cerrar comicio' }))
      .toBeInTheDocument()
  })

  it('abre diálogo de confirmación al hacer clic en "Cerrar comicio"', async () => {
    vi.mocked(obtenerEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'ABIERTA',
    })

    await renderPanel()

    const cerrarButton = page.getByRole('button', { name: 'Cerrar comicio' })
    await userEvent.click(cerrarButton)

    await expect
      .element(page.getByRole('heading', { name: '¿Cerrar el comicio?' }))
      .toBeInTheDocument()
  })

  it('actualiza estado tras cierre exitoso', async () => {
    vi.mocked(obtenerEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'ABIERTA',
    })
    vi.mocked(cerrarEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'CERRADA',
    })

    await renderPanel()

    const cerrarButton = page.getByRole('button', { name: 'Cerrar comicio' })
    await userEvent.click(cerrarButton)

    const confirmButton = page.getByRole('button', {
      name: 'Sí, cerrar comicio',
    })
    await userEvent.click(confirmButton)

    expect(cerrarEleccion).toHaveBeenCalledWith(1)
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

const mockLista: Lista = {
  idLista: 42,
  idBoleta: 7,
  nombre: 'Lista Azul',
  sigla: 'LA',
  color: '#2563eb',
  logoUrl: null,
  estado: 'BORRADOR',
  listId: null,
  fechaOficializacion: null,
  candidatos: [],
}

describe('OfertaElectoralPanel - Eliminar lista', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()

    vi.mocked(obtenerEleccion).mockResolvedValue({
      ...mockEleccionConfigurada,
      estado: 'BORRADOR',
    })
    vi.mocked(listarListas).mockResolvedValue([mockLista])
    vi.mocked(obtenerMapeoListas).mockResolvedValue([])
    vi.mocked(obtenerConfiguracionDatosCandidato).mockResolvedValue({
      idEleccion: 1,
      campos: [],
      editable: true,
      cantidadCandidatos: 0,
    } satisfies ConfiguracionDatosCandidatoResponse)
  })

  async function renderPanel() {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfertaElectoralPanel idEleccion={1} />
      </QueryClientProvider>
    )
  }

  it('abre diálogo de confirmación al eliminar una lista', async () => {
    await renderPanel()

    const eliminarButton = page.getByRole('button', {
      name: 'Eliminar lista Lista Azul',
    })
    await userEvent.click(eliminarButton)

    const dialog = page.getByRole('alertdialog')
    await expect
      .element(page.getByRole('heading', { name: '¿Eliminar la lista?' }))
      .toBeInTheDocument()
    await expect
      .element(dialog.getByText(/Se eliminará la lista/))
      .toBeInTheDocument()
    await expect
      .element(dialog.getByText('Lista Azul', { exact: true }))
      .toBeInTheDocument()
    expect(eliminarLista).not.toHaveBeenCalled()
  })

  it('no elimina la lista si se cancela la confirmación', async () => {
    await renderPanel()

    const eliminarButton = page.getByRole('button', {
      name: 'Eliminar lista Lista Azul',
    })
    await userEvent.click(eliminarButton)

    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await userEvent.click(cancelButton)

    expect(eliminarLista).not.toHaveBeenCalled()
    await expect
      .poll(() =>
        page.getByRole('heading', { name: '¿Eliminar la lista?' }).query()
      )
      .toBeNull()
  })

  it('elimina la lista solo tras confirmar en el diálogo', async () => {
    vi.mocked(eliminarLista).mockResolvedValue(undefined)

    await renderPanel()

    const eliminarButton = page.getByRole('button', {
      name: 'Eliminar lista Lista Azul',
    })
    await userEvent.click(eliminarButton)

    const confirmButton = page.getByRole('button', {
      name: 'Sí, eliminar lista',
    })
    await userEvent.click(confirmButton)

    await vi.waitFor(() => {
      expect(eliminarLista).toHaveBeenCalled()
      expect(vi.mocked(eliminarLista).mock.calls[0]?.[0]).toBe(42)
    })
  })
})

describe('OfertaElectoralPanel - Eliminar Comicio', () => {
  let queryClient: QueryClient

  const mockEleccionBorrador: Eleccion = {
    ...mockEleccionConfigurada,
    estado: 'BORRADOR',
  } as Eleccion

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()

    vi.mocked(obtenerEleccion).mockResolvedValue(mockEleccionBorrador)
    vi.mocked(listarListas).mockResolvedValue([])
    vi.mocked(obtenerMapeoListas).mockResolvedValue([])
    vi.mocked(obtenerConfiguracionDatosCandidato).mockResolvedValue({
      idEleccion: 1,
      campos: [],
      editable: true,
      cantidadCandidatos: 0,
    } satisfies ConfiguracionDatosCandidatoResponse)
  })

  async function renderPanel() {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfertaElectoralPanel idEleccion={1} />
      </QueryClientProvider>
    )
  }

  it('elimina el comicio tras confirmar con el nombre exacto', async () => {
    vi.mocked(eliminarEleccion).mockResolvedValue(undefined)

    await renderPanel()

    await userEvent.click(
      page.getByRole('button', { name: 'Eliminar comicio' })
    )

    const confirmButton = page.getByRole('button', {
      name: 'Sí, eliminar comicio',
    })
    await expect.element(confirmButton).toBeDisabled()

    await userEvent.fill(
      page.getByRole('textbox', {
        name: 'Escribí Elección Municipal 2025 para confirmar',
      }),
      'Elección Municipal 2025'
    )
    await expect.element(confirmButton).toBeEnabled()
    await userEvent.click(confirmButton)

    await vi.waitFor(() => {
      expect(eliminarEleccion).toHaveBeenCalledWith(1)
    })
  })

  it('no elimina el comicio si el nombre de confirmación no coincide', async () => {
    vi.mocked(eliminarEleccion).mockResolvedValue(undefined)

    await renderPanel()

    await userEvent.click(
      page.getByRole('button', { name: 'Eliminar comicio' })
    )

    await userEvent.fill(
      page.getByRole('textbox', {
        name: 'Escribí Elección Municipal 2025 para confirmar',
      }),
      'nombre incorrecto'
    )

    await expect
      .element(page.getByRole('button', { name: 'Sí, eliminar comicio' }))
      .toBeDisabled()
    expect(eliminarEleccion).not.toHaveBeenCalled()
  })
})
