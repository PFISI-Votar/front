import { useEffect } from 'react'
import { type QueryKey, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { totalVotantesPublicoQueryKey } from '@/features/padron/hooks/use-padron'
import { contratoEstadoPublicaQueryKey } from './use-contrato-estado-publica'
import { dashboardPublicoComicioQueryKey } from './use-dashboard-publico-comicio'
import { escrutinioQueryKey } from './use-escrutinio'
import { ofertaPublicaQueryKey } from './use-oferta-publica'
import { participacionPublicaQueryPrefix } from './use-participacion-publica'
import { revotoStatsPublicaQueryPrefix } from './use-revoto-stats-publica'
import { transaccionesPublicaQueryKey } from './use-transacciones-publica'

// Socket.IO va directo al backend: el proxy /api de Vercel no reenvía
// websockets. Los eventos son públicos, no dependen de cookies de sesión.
const BACKEND_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'
const INVALIDATION_WINDOW_MS = 1_000

type ResultadosActualizadosEvent = {
  idEleccion: number
  actualizadoEn: string
  totalVotos: number
}

type EleccionEvent = {
  idEleccion: number
}

const liveStatsQueryKeys = (idEleccion: number): QueryKey[] => [
  escrutinioQueryKey(idEleccion),
  participacionPublicaQueryPrefix(idEleccion),
  revotoStatsPublicaQueryPrefix(idEleccion),
  transaccionesPublicaQueryKey(idEleccion),
  contratoEstadoPublicaQueryKey(idEleccion),
]

const allDashboardQueryKeys = (idEleccion: number): QueryKey[] => [
  dashboardPublicoComicioQueryKey(idEleccion),
  ofertaPublicaQueryKey(idEleccion),
  totalVotantesPublicoQueryKey(idEleccion),
  ...liveStatsQueryKeys(idEleccion),
]

/**
 * VOTAR-518: mantiene sincronizadas las ocho vistas del dashboard público.
 * Las invalidaciones se agrupan durante un segundo para que una ráfaga de
 * votos produzca un solo refetch por query y por cliente.
 */
export const useDashboardPublicoWebSocket = (
  idEleccion: number,
  enabled = true
) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !Number.isFinite(idEleccion) || idEleccion <= 0) {
      return
    }

    const pendingQueryKeys = new Map<string, QueryKey>()
    let invalidationTimer: ReturnType<typeof setTimeout> | undefined
    let hasConnected = false

    const scheduleInvalidation = (queryKeys: QueryKey[]) => {
      for (const queryKey of queryKeys) {
        pendingQueryKeys.set(JSON.stringify(queryKey), queryKey)
      }
      if (invalidationTimer) return

      invalidationTimer = setTimeout(() => {
        const queryKeysToInvalidate = [...pendingQueryKeys.values()]
        pendingQueryKeys.clear()
        invalidationTimer = undefined
        for (const queryKey of queryKeysToInvalidate) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }, INVALIDATION_WINDOW_MS)
    }

    const socket = io(`${BACKEND_URL}/elecciones`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })

    socket.on('connect', () => {
      socket.emit('dashboard:subscribe', { idEleccion })
      if (hasConnected) {
        // Los eventos ocurridos sin conexión no se pueden recuperar: al volver,
        // revalidar todo el dashboard contra el estado actual del backend.
        scheduleInvalidation(allDashboardQueryKeys(idEleccion))
      }
      hasConnected = true
    })

    socket.on(
      'resultados:actualizados',
      (data: ResultadosActualizadosEvent) => {
        if (data.idEleccion !== idEleccion) return
        scheduleInvalidation(liveStatsQueryKeys(idEleccion))
      }
    )

    // Aviso sin datos: el backend lo envía también cuando la autoridad ocultó
    // "Resultados" (en ese caso no llega `resultados:actualizados`).
    socket.on('dashboard:actualizado', (data: EleccionEvent) => {
      if (data.idEleccion !== idEleccion) return
      scheduleInvalidation(liveStatsQueryKeys(idEleccion))
    })

    const refreshElectionState = (data: EleccionEvent) => {
      if (data.idEleccion !== idEleccion) return
      scheduleInvalidation(allDashboardQueryKeys(idEleccion))
    }

    socket.on('eleccion:abierta', refreshElectionState)
    socket.on('eleccion:cerrada', refreshElectionState)
    socket.on('eleccion:pausada', refreshElectionState)
    socket.on('eleccion:reanudada', refreshElectionState)
    socket.on('eleccion:archivada', refreshElectionState)

    socket.on('eleccion:merkle-publicado', (data: EleccionEvent) => {
      if (data.idEleccion !== idEleccion) return
      scheduleInvalidation([
        dashboardPublicoComicioQueryKey(idEleccion),
        totalVotantesPublicoQueryKey(idEleccion),
        contratoEstadoPublicaQueryKey(idEleccion),
        transaccionesPublicaQueryKey(idEleccion),
      ])
    })

    return () => {
      if (invalidationTimer) clearTimeout(invalidationTimer)
      pendingQueryKeys.clear()
      socket.emit('dashboard:unsubscribe', { idEleccion })
      socket.disconnect()
    }
  }, [enabled, idEleccion, queryClient])
}
