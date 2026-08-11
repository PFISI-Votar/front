import { ZodError } from 'zod'
import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerEscrutinio } from '@/features/dashboard-publico/api/escrutinio-api'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'

export const escrutinioQueryKey = (idEleccion: number) =>
  ['dashboard-publico-escrutinio', idEleccion] as const

/**
 * VOTAR-364: TanStack Query for public escrutinio.
 * Polls every 5s as fallback while live; WebSocket invalidation is preferred.
 *
 * La queryFn loguea ZodError explícitamente para hacer visible cualquier
 * mismatch entre el schema del front y la respuesta de la API, que de otra
 * forma queda silenciado (el request llega con 200 pero el parse falla en
 * el browser sin dejar rastro en Network).
 */
export const useEscrutinio = (idEleccion: number, enabled = true) =>
  useQuery({
    queryKey: escrutinioQueryKey(idEleccion),
    queryFn: async () => {
      try {
        return await obtenerEscrutinio(idEleccion)
      } catch (error) {
        if (error instanceof ZodError) {
          // Si ves esto en consola, el back está devolviendo un campo que el
          // schema no espera, o falta un campo que el schema requiere.

          // eslint-disable-next-line no-console
          console.error(
            '[useEscrutinio] ZodError — mismatch entre schema y respuesta de API:',
            error.format()
          )
        }
        throw error // re-throw siempre para que TanStack Query lo maneje
      }
    },
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
