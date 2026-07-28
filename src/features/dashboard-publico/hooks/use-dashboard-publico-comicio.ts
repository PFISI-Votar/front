import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { obtenerConfiguracionBud } from '@/features/voto/api/voto-api'

export const useDashboardPublicoComicio = (idEleccion: number) =>
  useQuery({
    queryKey: ['dashboard-publico-comicio', idEleccion],
    queryFn: () => obtenerConfiguracionBud(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: (query) => {
      const data = query.state.data
      if (
        data?.resultadosDefinitivos ||
        data?.snapshotCongelado ||
        data?.estado === 'CERRADA' ||
        data?.estado === 'ESCRUTADA'
      ) {
        return false
      }
      return 30_000
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      return failureCount < 2
    },
  })

export const isDashboardFrozen = (data: {
  resultadosDefinitivos?: boolean
  snapshotCongelado?: boolean
  estado: string
}): boolean =>
  data.resultadosDefinitivos === true ||
  data.snapshotCongelado === true ||
  data.estado === 'CERRADA' ||
  data.estado === 'ESCRUTADA'
