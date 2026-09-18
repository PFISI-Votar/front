import { describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useEleccionWebSocket } from './use-eleccion-websocket'

type Handler = (data: unknown) => void

const handlers = new Map<string, Handler>()

const mockSocket = {
  on: vi.fn((event: string, handler: Handler) => {
    handlers.set(event, handler)
  }),
  disconnect: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

function emit(event: string, data: unknown) {
  handlers.get(event)?.(data)
}

describe('useEleccionWebSocket', () => {
  it('invokes onTransaccionEnProgreso when the backend reports an in-flight on-chain transaction (VOTAR-481)', async () => {
    const onTransaccionEnProgreso = vi.fn()
    await renderHook(() => useEleccionWebSocket({ onTransaccionEnProgreso }))

    emit('eleccion:transaccion-en-progreso', { idEleccion: 7, tipo: 'CIERRE' })

    expect(onTransaccionEnProgreso).toHaveBeenCalledWith({
      idEleccion: 7,
      tipo: 'CIERRE',
    })
  })

  it('invokes onTransaccionFallida when an in-flight on-chain transaction fails (VOTAR-481)', async () => {
    const onTransaccionFallida = vi.fn()
    await renderHook(() => useEleccionWebSocket({ onTransaccionFallida }))

    emit('eleccion:transaccion-fallida', { idEleccion: 7, tipo: 'APERTURA' })

    expect(onTransaccionFallida).toHaveBeenCalledWith({
      idEleccion: 7,
      tipo: 'APERTURA',
    })
  })

  it('does not throw when transaction events arrive without listeners registered', async () => {
    await renderHook(() => useEleccionWebSocket())

    expect(() =>
      emit('eleccion:transaccion-en-progreso', {
        idEleccion: 1,
        tipo: 'APERTURA',
      })
    ).not.toThrow()
  })
})
