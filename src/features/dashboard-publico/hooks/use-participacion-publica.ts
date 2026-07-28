import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerParticipacionPublica } from '@/features/dashboard-publico/api/participacion-publica-api'

type UseParticipacionPublicaOptions = {
  horas?: number
  isFrozen?: boolean
}

export const useParticipacionPublica = (
  idEleccion: number,
  options: UseParticipacionPublicaOptions = {}
) => {
  const { horas = 12, isFrozen = false } = options

  return useQuery({
    queryKey: ['participacion-publica', idEleccion, horas],
    queryFn: () => obtenerParticipacionPublica(idEleccion, horas),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: isFrozen ? false : 30_000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      if (isAxiosError(error) && error.response?.status === 422) return false
      return failureCount < 2
    },
  })
}
