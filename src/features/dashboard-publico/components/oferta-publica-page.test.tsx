import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { OfertaPublicaPage } from './oferta-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerOfertaPublica: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    to?: string
    params?: Record<string, string>
    className?: string
  }) => (
    <a href={props.to ?? '#'} className={props.className}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/dashboard-publico/api/oferta-publica-api', () => ({
  obtenerOfertaPublica: mocks.obtenerOfertaPublica,
}))

const ofertaMock = {
  idEleccion: 6,
  nombreEleccion: 'Elección Centro de Estudiantes',
  estadoEleccion: 'CONFIGURADA',
  idBoleta: 10,
  titulo: 'Boleta oficial',
  permitirVotoEnBlanco: true,
  permitirVotoNulo: true,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      descripcion: 'Autoridad máxima del centro',
      orden: 1,
      estado: 'DISPONIBLE' as const,
      candidatos: [
        {
          idCandidato: 100,
          idCategoria: 1,
          idLista: 10,
          listId: 1,
          nombre: 'Ana',
          apellido: 'Alvarez',
          nombreCompleto: 'Ana Alvarez',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          logoListaUrl: '/uploads/listas/azul.png',
          fotoUrl: '/uploads/candidatos/ana.jpg',
        },
        {
          idCandidato: 200,
          idCategoria: 1,
          idLista: 20,
          listId: 2,
          nombre: 'Bruno',
          apellido: 'Barrera',
          nombreCompleto: 'Bruno Barrera',
          agrupacionPolitica: 'Lista Celeste',
          numeroLista: 2,
          colorLista: '#2563eb',
          logoListaUrl: null,
          fotoUrl: null,
        },
      ],
    },
    {
      idCategoria: 2,
      nombre: 'Vocales',
      descripcion: null,
      orden: 2,
      estado: 'DISPONIBLE' as const,
      candidatos: [
        {
          idCandidato: 101,
          idCategoria: 2,
          idLista: 10,
          listId: 1,
          nombre: 'Valeria',
          apellido: 'Vocal',
          nombreCompleto: 'Valeria Vocal',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          logoListaUrl: '/uploads/listas/azul.png',
          fotoUrl: null,
        },
      ],
    },
  ],
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <OfertaPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('OfertaPublicaPage — VOTAR-368', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CONFIGURADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.obtenerOfertaPublica.mockResolvedValue(ofertaMock)
  })

  it('UAT-01: lista listas y candidatos sin autenticación', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Elección Centro de Estudiantes/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Acceso público/i))
      .toBeInTheDocument()
    await expect.element(screen.getByText('Ana Alvarez')).toBeInTheDocument()
    await expect.element(screen.getByText('Bruno Barrera')).toBeInTheDocument()
    await expect.element(screen.getByText('Valeria Vocal')).toBeInTheDocument()
    await expect
      .element(screen.getByText(/Lista 2 — Lista Celeste/))
      .toBeInTheDocument()
    expect(mocks.obtenerOfertaPublica).toHaveBeenCalledWith(6)
  })

  it('UAT-02: muestra nombres, categorías y fotografías', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByRole('heading', { name: 'Presidente' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('heading', { name: 'Vocales' }))
      .toBeInTheDocument()
    const fotoAna = screen.getByAltText('Foto de Ana Alvarez')
    await expect.element(fotoAna).toBeInTheDocument()
    // VOTAR-466: el dashboard público es servido por el front, no por la
    // API — sin resolveMediaUrl, `fotoUrl` relativo ('/uploads/...' o
    // '/imagenes/...') resolvería contra el origen equivocado.
    await expect
      .element(fotoAna)
      .toHaveAttribute(
        'src',
        'http://localhost:3000/uploads/candidatos/ana.jpg'
      )
    await expect
      .element(screen.getByText(/Autoridad máxima del centro/i))
      .toBeInTheDocument()
  })

  it('muestra mensaje cuando la oferta aún no fue oficializada (404)', async () => {
    mocks.obtenerOfertaPublica.mockRejectedValue(
      new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: { message: 'La oferta electoral aún no fue oficializada' },
      })
    )

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Oferta aún no oficializada/i))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByText(
          /Vuelva a consultar cuando la autoridad electoral publique las listas/i
        )
      )
      .toBeInTheDocument()
  })

  it('incluye la pestaña Oferta electoral en la navegación pública', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByRole('navigation', { name: /dashboard público/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Oferta electoral'))
      .toBeInTheDocument()
  })

  it('rechaza un identificador de comicio inválido', async () => {
    const screen = await renderPage(Number.NaN)

    await expect
      .element(screen.getByText(/Identificador de comicio inválido/i))
      .toBeInTheDocument()
    expect(mocks.obtenerOfertaPublica).not.toHaveBeenCalled()
  })
})
