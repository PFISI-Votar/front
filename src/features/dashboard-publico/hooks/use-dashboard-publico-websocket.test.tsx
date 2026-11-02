import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { totalVotantesPublicoQueryKey } from '@/features/padron/hooks/use-padron'
import { contratoEstadoPublicaQueryKey } from './use-contrato-estado-publica'
import { dashboardPublicoComicioQueryKey } from './use-dashboard-publico-comicio'
import { useDashboardPublicoWebSocket } from './use-dashboard-publico-websocket'
import { escrutinioQueryKey } from './use-escrutinio'
import { ofertaPublicaQueryKey } from './use-oferta-publica'
import { participacionPublicaQueryKey } from './use-participacion-publica'
import { revotoStatsPublicaQueryKey } from './use-revoto-stats-publica'
import { transaccionesPublicaQueryKey } from './use-transacciones-publica'

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

const emit = (event: string, idEleccion?: number) => {
  handlers.get(event)?.(idEleccion === undefined ? undefined : { idEleccion })
}

describe('useDashboardPublicoWebSocket', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const seedDashboardQueries = (idEleccion = 6) => {
    const keys = [
      dashboardPublicoComicioQueryKey(idEleccion),
      escrutinioQueryKey(idEleccion),
      ofertaPublicaQueryKey(idEleccion),
      totalVotantesPublicoQueryKey(idEleccion),
      participacionPublicaQueryKey(idEleccion, 24),
      revotoStatsPublicaQueryKey(idEleccion, 24),
      transaccionesPublicaQueryKey(idEleccion),
      contratoEstadoPublicaQueryKey(idEleccion),
    ]
    for (const key of keys) queryClient.setQueryData(key, {})
    return keys
  }

  beforeEach(() => {
    vi.useFakeTimers()
    handlers.clear()
    vi.clearAllMocks()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('invalida las keys reales de estadísticas y agrupa ráfagas (VOTAR-518)', async () => {
    const keys = seedDashboardQueries().filter(
      (key) =>
        key[0] !== 'dashboard-publico-comicio' &&
        key[0] !== 'oferta-publica' &&
        key[0] !== 'padron-total-votantes'
    )
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('resultados:actualizados', 6)
    emit('resultados:actualizados', 6)
    await vi.advanceTimersByTimeAsync(999)
    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
    }

    await vi.advanceTimersByTimeAsync(1)
    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    }
  })

  it('se suscribe al conectar y revalida las ocho páginas al reconectar', async () => {
    const keys = seedDashboardQueries()
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('connect')
    expect(mockSocket.emit).toHaveBeenCalledWith('dashboard:subscribe', {
      idEleccion: 6,
    })
    await vi.advanceTimersByTimeAsync(1_000)
    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
    }

    emit('connect')
    await vi.advanceTimersByTimeAsync(1_000)
    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    }
  })

  it('refresca las ocho páginas ante todos los eventos de estado', async () => {
    const keys = seedDashboardQueries()
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    for (const event of [
      'eleccion:abierta',
      'eleccion:cerrada',
      'eleccion:pausada',
      'eleccion:reanudada',
      'eleccion:archivada',
    ]) {
      emit(event, 6)
    }
    await vi.advanceTimersByTimeAsync(1_000)

    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    }
  })

  it('refresca comicio, padrón, estado técnico y transacciones al publicar Merkle', async () => {
    const keys = [
      dashboardPublicoComicioQueryKey(6),
      totalVotantesPublicoQueryKey(6),
      contratoEstadoPublicaQueryKey(6),
      transaccionesPublicaQueryKey(6),
    ]
    for (const key of keys) queryClient.setQueryData(key, {})
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('eleccion:merkle-publicado', 6)
    await vi.advanceTimersByTimeAsync(1_000)

    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    }
  })

  it('ignora eventos de otros comicios', async () => {
    const keys = seedDashboardQueries()
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    emit('resultados:actualizados', 7)
    emit('eleccion:cerrada', 7)
    emit('eleccion:merkle-publicado', 7)
    await vi.advanceTimersByTimeAsync(1_000)

    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
    }
  })

  it('no conecta cuando está deshabilitado', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6, false), { wrapper })

    expect(io).not.toHaveBeenCalled()
  })

  it('cancela invalidaciones pendientes y desconecta durante el cleanup', async () => {
    const key = escrutinioQueryKey(6)
    queryClient.setQueryData(key, {})
    const rendered = await renderHook(() => useDashboardPublicoWebSocket(6), {
      wrapper,
    })
    emit('resultados:actualizados', 6)

    await rendered.unmount()
    await vi.advanceTimersByTimeAsync(1_000)

    expect(mockSocket.emit).toHaveBeenCalledWith('dashboard:unsubscribe', {
      idEleccion: 6,
    })
    expect(mockSocket.disconnect).toHaveBeenCalledOnce()
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
  })

  it('configura reconexión ilimitada', async () => {
    await renderHook(() => useDashboardPublicoWebSocket(6), { wrapper })

    expect(io).toHaveBeenCalledWith(
      expect.stringContaining('/elecciones'),
      expect.objectContaining({ reconnectionAttempts: Infinity })
    )
  })
})
