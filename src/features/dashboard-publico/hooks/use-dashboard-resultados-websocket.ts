import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type ResultadosActualizadosEvent = {
  idEleccion: number
  actualizadoEn: string
  totalVotos: number
}

type EleccionEvent = {
  idEleccion: number
}

const LIVE_STATS_QUERY_KEYS = [
  'dashboard-publico-escrutinio',
  'participacion-publica',
  'revoto-stats-publica',
  'transacciones-publica',
  'contrato-estado-publica',
] as const

/**
 * VOTAR-518: mantiene sincronizadas todas las vistas del dashboard público.
 * La invalidación por prefijo actualiza también las variantes parametrizadas
 * (por ejemplo, participación y re-voto para distintos rangos de horas).
 */
export const useDashboardPublicoWebSocket = (
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
        for (const queryKey of LIVE_STATS_QUERY_KEYS) {
          void queryClient.invalidateQueries({
            queryKey: [queryKey, idEleccion],
          })
        }
      }
    )

    const refreshElectionState = (data: EleccionEvent) => {
      if (data.idEleccion !== idEleccion) return
      void queryClient.invalidateQueries({
        queryKey: ['dashboard-publico-comicio', idEleccion],
      })
      for (const queryKey of LIVE_STATS_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey: [queryKey, idEleccion] })
      }
    }

    socket.on('eleccion:abierta', refreshElectionState)
    socket.on('eleccion:cerrada', refreshElectionState)
    socket.on('eleccion:pausada', refreshElectionState)
    socket.on('eleccion:reanudada', refreshElectionState)
    socket.on('eleccion:archivada', refreshElectionState)

    socket.on('eleccion:merkle-publicado', (data: EleccionEvent) => {
      if (data.idEleccion !== idEleccion) return
      void queryClient.invalidateQueries({
        queryKey: ['padron-total-votantes', idEleccion],
      })
      void queryClient.invalidateQueries({
        queryKey: ['contrato-estado-publica', idEleccion],
      })
    })

    return () => {
      socket.emit('dashboard:unsubscribe', { idEleccion })
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, idEleccion, queryClient])
}
