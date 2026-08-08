import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerRevotoStatsPublica } from '@/features/dashboard-publico/api/revoto-stats-publica-api'

type UseRevotoStatsPublicaOptions = {
  horas?: number
  isFrozen?: boolean
}

export const useRevotoStatsPublica = (
  idEleccion: number,
  options: UseRevotoStatsPublicaOptions = {}
) => {
  const { horas = 12, isFrozen = false } = options

  return useQuery({
    queryKey: ['revoto-stats-publica', idEleccion, horas],
    queryFn: () => obtenerRevotoStatsPublica(idEleccion, horas),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: isFrozen ? false : 4_000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      if (isAxiosError(error) && error.response?.status === 422) return false
      return failureCount < 2
    },
  })
}
