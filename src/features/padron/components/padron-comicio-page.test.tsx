import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { PadronComicioPage } from './padron-comicio-page'

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}))

const { usePadronResumenMock } = vi.hoisted(() => ({
  usePadronResumenMock: vi.fn(),
}))

const { usePadronMerkleMock } = vi.hoisted(() => ({
  usePadronMerkleMock: vi.fn(),
}))

const { usePadronVotantesMock } = vi.hoisted(() => ({
  usePadronVotantesMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: useQueryMock,
  }
})

vi.mock('@/features/padron/hooks/use-padron', () => ({
  usePadronResumen: usePadronResumenMock,
  usePadronMerkle: usePadronMerkleMock,
  usePadronVotantes: usePadronVotantesMock,
  PADRON_PAGE_SIZES: [50, 100, 200],
}))

vi.mock('@/features/padron/hooks/use-publicar-merkle', () => ({
  usePublicarMerkle: vi.fn().mockReturnValue({
    runInBackground: vi.fn(),
    isRunning: false,
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children, ...props }: React.PropsWithChildren<unknown>) => (
      <a {...props}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
  }
})

const renderPage = async (
  estado: string = 'BORRADOR',
  metodosAutenticacion: string[] = []
) => {
  const qc = new QueryClient()

  useQueryMock.mockReturnValue({
    data: {
      idEleccion: 42,
      nombre: 'Elección de prueba',
      estado,
      metodosAutenticacion,
    },
    isLoading: false,
    isError: false,
  })

  usePadronResumenMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      data: undefined,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
    }),
  })

  usePadronMerkleMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  })

  usePadronVotantesMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  })

  return render(
    <QueryClientProvider client={qc}>
      <PadronComicioPage idEleccion={42} />
    </QueryClientProvider>
  )
}

describe('PadronComicioPage — VOTAR-336', () => {
  describe('carga de padrón para comicios con Google', () => {
    it('fuerza el correo como criterio y oculta las otras opciones', async () => {
      const screen = await renderPage('BORRADOR', ['GOOGLE'])

      await userEvent.click(
        screen.getByRole('button', { name: /Cargar padrón electoral/i })
      )

      await expect
        .element(
          screen.getByText(/usa Google.*padrón.*únicamente por su correo/i)
        )
        .toBeInTheDocument()
      await expect.element(screen.getByText('Solo DNI')).not.toBeInTheDocument()
      await expect
        .element(screen.getByText('DNI y Email combinados'))
        .not.toBeInTheDocument()
      await expect
        .element(screen.getByText('Email', { exact: true }))
        .toBeInTheDocument()
    })
  })

  describe('UAT-02: Advertencia de padrón sellado', () => {
    it('muestra alerta de padrón sellado cuando el estado es ABIERTA', async () => {
      const screen = await renderPage('ABIERTA')

      await expect
        .element(screen.getByText(/Padrón Sellado Criptográficamente/i))
        .toBeInTheDocument()

      await expect
        .element(
          screen.getByText(
            /El padrón electoral se encuentra sellado y no admite alteraciones/i
          )
        )
        .toBeInTheDocument()

      await expect.element(screen.getByText(/Ley 25\.326/i)).toBeInTheDocument()
    })

    it('NO muestra alerta de padrón sellado cuando el estado es BORRADOR', async () => {
      const screen = await renderPage('BORRADOR')

      await expect
        .element(screen.getByText(/Padrón Sellado Criptográficamente/i))
        .not.toBeInTheDocument()
    })

    it('NO muestra alerta de padrón sellado cuando el estado es CONFIGURADA', async () => {
      const screen = await renderPage('CONFIGURADA')

      await expect
        .element(screen.getByText(/Padrón Sellado Criptográficamente/i))
        .not.toBeInTheDocument()
    })

    it('muestra icono de Lock cuando el estado es ABIERTA', async () => {
      const screen = await renderPage('ABIERTA')

      // Verify the alert title is present
      const alertTitle = screen.getByText(/Padrón Sellado Criptográficamente/i)
      await expect.element(alertTitle).toBeInTheDocument()

      // Verify the Lock icon SVG is present in the DOM
      // The lucide-lock class is added to the Lock icon component
      const lockIcon = screen.container.querySelector('svg.lucide-lock')
      expect(lockIcon).toBeTruthy()
    })
  })
})
