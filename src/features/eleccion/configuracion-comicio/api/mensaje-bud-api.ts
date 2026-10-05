import { apiClient } from '@/lib/api-client'
import type {
  GuardarMensajeBudInput,
  MensajeBud,
} from '@/features/eleccion/configuracion-comicio/data/schema'

export const obtenerMensajeBud = async (
  idEleccion: number
): Promise<MensajeBud> => {
  const { data } = await apiClient.get<MensajeBud>(
    `/elecciones/${idEleccion}/mensaje-bud`
  )
  return data
}

export const guardarMensajeBud = async (
  idEleccion: number,
  input: GuardarMensajeBudInput
): Promise<MensajeBud> => {
  const { data } = await apiClient.put<MensajeBud>(
    `/elecciones/${idEleccion}/mensaje-bud`,
    input
  )
  return data
}
