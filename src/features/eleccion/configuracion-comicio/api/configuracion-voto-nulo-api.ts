import { apiClient } from '@/lib/api-client'
import type {
  ConfiguracionVotoNulo,
  GuardarConfiguracionVotoNuloInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'

export const obtenerConfiguracionVotoNulo = async (
  idEleccion: number
): Promise<ConfiguracionVotoNulo> => {
  const { data } = await apiClient.get<ConfiguracionVotoNulo>(
    `/elecciones/${idEleccion}/configuracion-voto-nulo`
  )
  return data
}

export const guardarConfiguracionVotoNulo = async (
  idEleccion: number,
  input: GuardarConfiguracionVotoNuloInput
): Promise<ConfiguracionVotoNulo> => {
  const { data } = await apiClient.put<ConfiguracionVotoNulo>(
    `/elecciones/${idEleccion}/configuracion-voto-nulo`,
    input
  )
  return data
}
