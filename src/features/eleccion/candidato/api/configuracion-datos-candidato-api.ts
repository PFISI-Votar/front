import { apiClient } from '@/lib/api-client'
import type {
  CampoCandidatoDefinicion,
  ConfiguracionDatosCandidatoResponse,
  GuardarConfiguracionInput,
} from '@/features/eleccion/candidato/data/schema'

export const obtenerConfiguracionDatosCandidato = async (
  idEleccion: number,
): Promise<ConfiguracionDatosCandidatoResponse> => {
  const { data } = await apiClient.get<ConfiguracionDatosCandidatoResponse>(
    `/elecciones/${idEleccion}/configuracion-datos-candidato`,
  )
  return data
}

export const guardarConfiguracionDatosCandidato = async (
  idEleccion: number,
  input: GuardarConfiguracionInput,
): Promise<ConfiguracionDatosCandidatoResponse> => {
  const { data } = await apiClient.put<ConfiguracionDatosCandidatoResponse>(
    `/elecciones/${idEleccion}/configuracion-datos-candidato`,
    input,
  )
  return data
}

export type { CampoCandidatoDefinicion }
