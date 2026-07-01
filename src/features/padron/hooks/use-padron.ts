import { isAxiosError } from 'axios'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listarPadronVotantes, obtenerPadronResumen } from '../api/padron-api'

const PAGE_SIZE = 50

/** Tamaños de página disponibles para la tabla de hashes (máx. 200 en backend). */
export const PADRON_PAGE_SIZES = [25, 50, 100, 200] as const

/**
 * Resumen del padrón de un comicio. Un 404 (sin padrón cargado) no se
 * reintenta: la vista lo trata como estado vacío.
 */
export function usePadronResumen(idEleccion: number) {
  return useQuery({
    queryKey: ['padron-resumen', idEleccion],
    queryFn: () => obtenerPadronResumen(idEleccion),
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

/** Hojas del padrón paginadas; sólo se consulta cuando `enabled` es true. */
export function usePadronVotantes(
  idEleccion: number,
  page: number,
  limit: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['padron-votantes', idEleccion, page, limit],
    queryFn: () => listarPadronVotantes(idEleccion, page, limit),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export const PADRON_PAGE_SIZE = PAGE_SIZE
