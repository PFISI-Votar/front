import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guardarVisibilidadDashboard,
  obtenerVisibilidadDashboard,
} from '@/features/eleccion/configuracion-comicio/api/visibilidad-dashboard-api'
import type { GuardarVisibilidadDashboardInput } from '@/features/eleccion/configuracion-comicio/data/schema'

export const visibilidadDashboardQueryKey = (idEleccion: number) =>
  ['visibilidad-dashboard', idEleccion] as const

export const useVisibilidadDashboard = (idEleccion: number) =>
  useQuery({
    queryKey: visibilidadDashboardQueryKey(idEleccion),
    queryFn: () => obtenerVisibilidadDashboard(idEleccion),
  })

export const useGuardarVisibilidadDashboard = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuardarVisibilidadDashboardInput) =>
      guardarVisibilidadDashboard(idEleccion, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: visibilidadDashboardQueryKey(idEleccion),
      })
    },
  })
}
