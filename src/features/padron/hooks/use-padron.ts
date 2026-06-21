import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  listarPadronVotantes,
  obtenerPadronResumen,
} from '../api/padron-api'

const PAGE_SIZE = 50

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
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['padron-votantes', idEleccion, page],
    queryFn: () => listarPadronVotantes(idEleccion, page, PAGE_SIZE),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export const PADRON_PAGE_SIZE = PAGE_SIZE
