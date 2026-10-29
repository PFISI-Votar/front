import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useDashboardPublicoWebSocket } from './use-dashboard-resultados-websocket'

type Handler = (data?: { idEleccion: number }) => void

const handlers = new Map<string, Handler>()
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn((event: string, handler: Handler) => {
    handlers.set(event, handler)
  }),
  disconnect: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

const emit = (event: string, idEleccion: number) => {
  handlers.get(event)?.({ idEleccion })
}

describe('useDashboardPublicoWebSocket', () => {
  let queryClient: QueryClient
  let invalidateQueries: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    handlers.clear()
    vi.clearAllMocks()
    queryClient = new QueryClient()
    invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('refresca todas las estadísticas cuando cambia el escrutinio (VOTAR-518)', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('resultados:actualizados', 6)

    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['dashboard-publico-escrutinio', 6],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['participacion-publica', 6],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: ['revoto-stats-publica', 6],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(4, {
      queryKey: ['transacciones-publica', 6],
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(5, {
      queryKey: ['contrato-estado-publica', 6],
    })
  })

  it('refresca el estado y las estadísticas ante cambios del comicio', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('eleccion:cerrada', 6)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dashboard-publico-comicio', 6],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dashboard-publico-escrutinio', 6],
    })
  })

  it('ignora eventos de otros comicios', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('resultados:actualizados', 7)
    emit('eleccion:cerrada', 7)

    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('refresca padrón y estado técnico cuando se publica la raíz Merkle', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('eleccion:merkle-publicado', 6)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['padron-total-votantes', 6],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['contrato-estado-publica', 6],
    })
  })
})
