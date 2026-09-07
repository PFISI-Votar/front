import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarCandidatos } from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import { listarCategorias } from '@/features/eleccion/categoria/api/categoria-api'
import type { Categoria } from '@/features/eleccion/categoria/data/schema'
import type { Eleccion } from '@/features/eleccion/data/schema'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'
import type { Lista } from '@/features/eleccion/lista/data/schema'
import { ListaDetailPanel } from './lista-detail-panel'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<unknown>) => (
    <a {...props}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  obtenerEleccion: vi.fn(),
}))

vi.mock('@/features/eleccion/candidato/api/candidato-api', () => ({
  listarCandidatos: vi.fn(),
  crearCandidato: vi.fn(),
  actualizarCandidato: vi.fn(),
  eliminarCandidato: vi.fn(),
  subirFotoCandidato: vi.fn(),
  eliminarFotoCandidato: vi.fn(),
}))

vi.mock(
  '@/features/eleccion/candidato/api/configuracion-datos-candidato-api',
  () => ({
    obtenerConfiguracionDatosCandidato: vi.fn(),
  })
)

vi.mock('@/features/eleccion/categoria/api/categoria-api', () => ({
  listarCategorias: vi.fn(),
}))

vi.mock('@/features/eleccion/lista/api/lista-api', () => ({
  listarListas: vi.fn(),
  actualizarLista: vi.fn(),
  eliminarLista: vi.fn(),
}))

const mockEleccionBorrador: Eleccion = {
  idEleccion: 1,
  nombre: 'Elección Centro de Estudiantes',
  estado: 'BORRADOR',
} as Eleccion

const mockLista: Lista = {
  idLista: 10,
  idBoleta: 1,
  nombre: 'Lista Frente Universitario',
  sigla: 'LFU',
  color: null,
  logoUrl: null,
  estado: 'PENDIENTE',
  listId: null,
  fechaOficializacion: null,
} as Lista

const buildCategoria = (overrides: Partial<Categoria>): Categoria => ({
  idCategoria: 100,
  idBoleta: 1,
  nombre: 'Presidencia',
  descripcion: null,
  cantidadCargos: 1,
  minimoPostulantes: 1,
  orden: 1,
  ...overrides,
})

const buildCandidato = (overrides: Partial<Candidato>): Candidato => ({
  idCandidato: 500,
  idLista: 10,
  idCategoria: 100,
  nombre: 'Ada',
  apellido: 'Lovelace',
  orden: 1,
  fotoUrl: null,
  datosAdicionales: {},
  ...overrides,
})

describe('ListaDetailPanel - botón Registrar candidato', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()

    vi.mocked(obtenerEleccion).mockResolvedValue(mockEleccionBorrador)
    vi.mocked(listarListas).mockResolvedValue([mockLista])
    vi.mocked(obtenerConfiguracionDatosCandidato).mockResolvedValue({
      idEleccion: 1,
      campos: [],
      editable: true,
      cantidadCandidatos: 0,
    } as never)
  })

  async function renderPanel() {
    return render(
      <QueryClientProvider client={queryClient}>
        <ListaDetailPanel idEleccion={1} idLista={10} />
      </QueryClientProvider>
    )
  }

  const registrarButton = () =>
    page.getByRole('button', {
      name: `Registrar candidato en ${mockLista.nombre}`,
    })

  it('deshabilita el botón y explica el motivo cuando no hay categorías', async () => {
    vi.mocked(listarCategorias).mockResolvedValue([])
    vi.mocked(listarCandidatos).mockResolvedValue([])

    await renderPanel()

    await expect.element(registrarButton().first()).toBeDisabled()
    await expect
      .element(page.getByText(/no tiene categorías electorales/i).first())
      .toBeInTheDocument()
  })

  it('muestra un tooltip con el motivo al pasar el cursor sobre el botón deshabilitado sin categorías', async () => {
    vi.mocked(listarCategorias).mockResolvedValue([])
    vi.mocked(listarCandidatos).mockResolvedValue([])

    await renderPanel()

    await expect.element(registrarButton().first()).toBeDisabled()

    const trigger = page
      .getByTestId('registrar-candidato-tooltip-trigger')
      .first()
    await trigger.hover()

    await expect
      .element(page.getByRole('tooltip').first())
      .toHaveTextContent(/no tiene categorías electorales/i)
  })

  it('deshabilita el botón cuando todas las categorías agotaron su cupo', async () => {
    vi.mocked(listarCategorias).mockResolvedValue([
      buildCategoria({ idCategoria: 100, cantidadCargos: 1 }),
    ])
    vi.mocked(listarCandidatos).mockResolvedValue([
      buildCandidato({ idCandidato: 500, idCategoria: 100 }),
    ])

    await renderPanel()

    await expect.element(registrarButton()).toBeDisabled()
    await expect
      .element(page.getByText(/cupo máximo de postulantes/i))
      .toBeInTheDocument()
  })

  it('habilita el botón cuando hay cupo disponible en alguna categoría', async () => {
    vi.mocked(listarCategorias).mockResolvedValue([
      buildCategoria({ idCategoria: 100, cantidadCargos: 3 }),
    ])
    vi.mocked(listarCandidatos).mockResolvedValue([
      buildCandidato({ idCandidato: 500, idCategoria: 100 }),
    ])

    await renderPanel()

    await expect.element(registrarButton()).toBeEnabled()
  })
})
