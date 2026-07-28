import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerEscrutinio } from '@/features/dashboard-publico/api/escrutinio-api'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'

export const escrutinioQueryKey = (idEleccion: number) =>
  ['dashboard-publico-escrutinio', idEleccion] as const

/**
 * VOTAR-364: TanStack Query for public escrutinio.
 * Polls every 5s as fallback while live; WebSocket invalidation is preferred.
 */
export const useEscrutinio = (idEleccion: number, enabled = true) =>
  useQuery({
    queryKey: escrutinioQueryKey(idEleccion),
    queryFn: () => obtenerEscrutinio(idEleccion),
    enabled: enabled && Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: (query) => {
      const data = query.state.data as Escrutinio | undefined
      if (!data) return 5_000
      if (
        data.congelado ||
        data.estado === 'CERRADA' ||
        data.estado === 'ESCRUTADA'
      ) {
        return false
      }
      return 5_000
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error)) {
        const status = error.response?.status
        if (status === 404 || status === 422 || status === 503) return false
      }
      return failureCount < 2
    },
  })
