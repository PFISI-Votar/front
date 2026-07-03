import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
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
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

const renderPage = async (estado: string = 'BORRADOR') => {
  const qc = new QueryClient()

  useQueryMock.mockReturnValue({
    data: {
      idEleccion: 42,
      nombre: 'Elección de prueba',
      estado,
    },
    isLoading: false,
    isError: false,
  })

  usePadronResumenMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: { response: { status: 404 } },
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
    </QueryClientProvider>,
  )
}

describe('PadronComicioPage — VOTAR-336', () => {
  describe('UAT-02: Advertencia de padrón sellado', () => {
    it('muestra alerta de padrón sellado cuando el estado es ABIERTA', async () => {
      const screen = await renderPage('ABIERTA')

      await expect
        .element(screen.getByText(/Padrón Sellado Criptográficamente/i))
        .toBeInTheDocument()

      await expect
        .element(
          screen.getByText(
            /El padrón electoral se encuentra sellado y no admite alteraciones/i,
          ),
        )
        .toBeInTheDocument()

      await expect
        .element(screen.getByText(/Ley 25\.326/i))
        .toBeInTheDocument()
    })

    it('NO muestra alerta de padrón sellado cuando el estado es BORRADOR', async () => {
      const screen = await renderPage('BORRADOR')

      await expect
        .element(screen.queryByText(/Padrón Sellado Criptográficamente/i))
        .not.toBeInTheDocument()
    })

    it('NO muestra alerta de padrón sellado cuando el estado es CONFIGURADA', async () => {
      const screen = await renderPage('CONFIGURADA')

      await expect
        .element(screen.queryByText(/Padrón Sellado Criptográficamente/i))
        .not.toBeInTheDocument()
    })

    it('muestra icono de Lock cuando el estado es ABIERTA', async () => {
      const screen = await renderPage('ABIERTA')

      // El icono Lock está presente en el DOM
      const alert = screen.getByText(/Padrón Sellado Criptográficamente/i)
        .closest('[role="alert"]')

      await expect.element(alert).toBeInTheDocument()
    })
  })
})
