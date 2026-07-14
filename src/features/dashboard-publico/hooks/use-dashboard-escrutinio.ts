import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerEscrutinioPublico } from '@/features/dashboard-publico/api/dashboard-publico-api'

export const useDashboardEscrutinio = (
  idEleccion: number,
  options?: { poll?: boolean }
) =>
  useQuery({
    queryKey: ['dashboard-publico-escrutinio', idEleccion],
    queryFn: () => obtenerEscrutinioPublico(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: options?.poll === false ? false : 30_000,
    retry: (failureCount, error) => {
      if (
        isAxiosError(error) &&
        [404, 503].includes(error.response?.status ?? 0)
      ) {
        return false
      }
      return failureCount < 2
    },
  })
