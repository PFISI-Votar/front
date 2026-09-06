import { apiClient } from '@/lib/api-client'
import type {
  GuardarVisibilidadDashboardInput,
  VisibilidadDashboard,
} from '@/features/eleccion/configuracion-comicio/data/schema'

export const obtenerVisibilidadDashboard = async (
  idEleccion: number
): Promise<VisibilidadDashboard> => {
  const { data } = await apiClient.get<VisibilidadDashboard>(
    `/elecciones/${idEleccion}/visibilidad-dashboard`
  )
  return data
}

export const guardarVisibilidadDashboard = async (
  idEleccion: number,
  input: GuardarVisibilidadDashboardInput
): Promise<VisibilidadDashboard> => {
  const { data } = await apiClient.put<VisibilidadDashboard>(
    `/elecciones/${idEleccion}/visibilidad-dashboard`,
    input
  )
  return data
}
