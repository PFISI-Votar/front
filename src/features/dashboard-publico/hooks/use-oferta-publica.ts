import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerOfertaPublica } from '@/features/dashboard-publico/api/oferta-publica-api'

/**
 * Oferta electoral oficializada del Portal de Transparencia (VOTAR-368).
 * Un 404 (aún no oficializada) no se reintenta.
 */
export const useOfertaPublica = (idEleccion: number) =>
  useQuery({
    queryKey: ['oferta-publica', idEleccion],
    queryFn: () => obtenerOfertaPublica(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      return failureCount < 2
    },
  })
