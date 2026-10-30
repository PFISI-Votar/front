import { apiClient } from '@/lib/api-client'
import type {
  GuardarPopupAlertaInput,
  PopupAlerta,
} from '@/features/eleccion/configuracion-comicio/data/schema'

export const obtenerPopupAlerta = async (
  idEleccion: number
): Promise<PopupAlerta> => {
  const { data } = await apiClient.get<PopupAlerta>(
    `/elecciones/${idEleccion}/configuracion-popup-alerta`
  )
  return data
}

export const guardarPopupAlerta = async (
  idEleccion: number,
  input: GuardarPopupAlertaInput
): Promise<PopupAlerta> => {
  const { data } = await apiClient.put<PopupAlerta>(
    `/elecciones/${idEleccion}/configuracion-popup-alerta`,
    input
  )
  return data
}
