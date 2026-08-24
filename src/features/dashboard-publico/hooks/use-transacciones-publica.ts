import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerTransaccionesPublica } from '@/features/dashboard-publico/api/transacciones-publica-api'

type UseTransaccionesPublicaOptions = {
  isFrozen?: boolean
}

export const useTransaccionesPublica = (
  idEleccion: number,
  options: UseTransaccionesPublicaOptions = {}
) => {
  const { isFrozen = false } = options

  return useQuery({
    queryKey: ['transacciones-publica', idEleccion],
    queryFn: () => obtenerTransaccionesPublica(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: isFrozen ? false : 30_000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      if (isAxiosError(error) && error.response?.status === 422) return false
      return failureCount < 2
    },
  })
}
