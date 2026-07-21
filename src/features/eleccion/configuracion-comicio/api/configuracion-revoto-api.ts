import { apiClient } from '@/lib/api-client'
import type {
  ConfiguracionRevoto,
  GuardarConfiguracionRevotoInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'

export const obtenerConfiguracionRevoto = async (
  idEleccion: number
): Promise<ConfiguracionRevoto> => {
  const { data } = await apiClient.get<ConfiguracionRevoto>(
    `/elecciones/${idEleccion}/configuracion-revoto`
  )
  return data
}

export const guardarConfiguracionRevoto = async (
  idEleccion: number,
  input: GuardarConfiguracionRevotoInput
): Promise<ConfiguracionRevoto> => {
  const { data } = await apiClient.put<ConfiguracionRevoto>(
    `/elecciones/${idEleccion}/configuracion-revoto`,
    input
  )
  return data
}
