import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerContratoEstadoPublica } from '@/features/dashboard-publico/api/contrato-estado-publica-api'

export const contratoEstadoPublicaQueryKey = (idEleccion: number) =>
  ['contrato-estado-publica', idEleccion] as const

type UseContratoEstadoPublicaOptions = {
  isFrozen?: boolean
}

export const useContratoEstadoPublica = (
  idEleccion: number,
  options: UseContratoEstadoPublicaOptions = {}
) => {
  const { isFrozen = false } = options

  return useQuery({
    queryKey: contratoEstadoPublicaQueryKey(idEleccion),
    queryFn: () => obtenerContratoEstadoPublica(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: isFrozen ? false : 30_000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      if (isAxiosError(error) && error.response?.status === 422) return false
      return failureCount < 2
    },
  })
}
