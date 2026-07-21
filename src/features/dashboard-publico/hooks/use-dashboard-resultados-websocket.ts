import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { escrutinioQueryKey } from '@/features/dashboard-publico/hooks/use-escrutinio'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type ResultadosActualizadosEvent = {
  idEleccion: number
  actualizadoEn: string
  totalVotos: number
}

/**
 * VOTAR-364: subscribes to dashboard room and invalidates escrutinio query on tally push.
 */
export const useDashboardResultadosWebSocket = (
  idEleccion: number,
  enabled = true
) => {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled || !Number.isFinite(idEleccion) || idEleccion <= 0) {
      return
    }

    const socket = io(`${BACKEND_URL}/elecciones`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('dashboard:subscribe', { idEleccion })
    })

    socket.on(
      'resultados:actualizados',
      (data: ResultadosActualizadosEvent) => {
        if (data.idEleccion !== idEleccion) return
        void queryClient.invalidateQueries({
          queryKey: escrutinioQueryKey(idEleccion),
        })
      }
    )

    socket.on('eleccion:cerrada', (data: { idEleccion: number }) => {
      if (data.idEleccion !== idEleccion) return
      void queryClient.invalidateQueries({
        queryKey: escrutinioQueryKey(idEleccion),
      })
      void queryClient.invalidateQueries({
        queryKey: ['dashboard-publico-comicio', idEleccion],
      })
    })

    return () => {
      socket.emit('dashboard:unsubscribe', { idEleccion })
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, idEleccion, queryClient])
}
