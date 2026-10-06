import type { ReactNode } from 'react'
import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useParams, useRouterState } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useComiciosBreadcrumbEntries } from '@/components/layout/comicios-breadcrumbs'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useRouterState: vi.fn(),
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  obtenerEleccion: vi.fn(),
}))

vi.mock('@/features/eleccion/lista/api/lista-api', () => ({
  listarListas: vi.fn(),
}))

const createNotFoundError = (message: string) =>
  new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: {} as never,
    data: { message },
  })

const createNetworkError = (message: string) =>
  new AxiosError(message, 'ERR_NETWORK', undefined, undefined, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {},
    config: {} as never,
    data: { message },
  })

describe('useComiciosBreadcrumbEntries (VOTAR-503)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
    vi.mocked(useParams).mockReturnValue({ idEleccion: '999' })
    vi.mocked(useRouterState).mockReturnValue(
      '/comicios/999/oferta' as unknown as ReturnType<typeof useRouterState>
    )
    vi.mocked(listarListas).mockResolvedValue([])
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('shows "Comicio no encontrado" when obtenerEleccion fails with 404', async () => {
    vi.mocked(obtenerEleccion).mockRejectedValue(
      createNotFoundError('Elección 999 no encontrada')
    )

    const { result } = await renderHook(() => useComiciosBreadcrumbEntries(), {
      wrapper,
    })

    await vi.waitFor(() => {
      expect(result.current).toEqual([
        { label: 'Comicios', to: '/comicios' },
        { label: 'Comicio no encontrado' },
      ])
    })
  })

  it('keeps the section switcher instead of "Comicio no encontrado" on a network/500 failure', async () => {
    vi.mocked(obtenerEleccion).mockRejectedValue(
      createNetworkError('Backend caído')
    )

    const { result } = await renderHook(() => useComiciosBreadcrumbEntries(), {
      wrapper,
    })

    await vi.waitFor(() => {
      expect(result.current).not.toContainEqual({
        label: 'Comicio no encontrado',
      })
      expect(result.current).toContainEqual(
        expect.objectContaining({ label: 'Comicio #999' })
      )
    })
  })
})
