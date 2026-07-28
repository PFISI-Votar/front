import { apiClient } from '@/lib/api-client'
import type {
  CreateComicioInput,
  Eleccion,
} from '@/features/eleccion/data/schema'

export const crearEleccion = async (
  input: CreateComicioInput
): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>('/elecciones', input)
  return data
}

export const actualizarEleccion = async (
  idEleccion: number,
  input: CreateComicioInput
): Promise<Eleccion> => {
  const { data } = await apiClient.patch<Eleccion>(
    `/elecciones/${idEleccion}`,
    input
  )
  return data
}

export const eliminarEleccion = async (idEleccion: number): Promise<void> => {
  await apiClient.delete(`/elecciones/${idEleccion}`)
}

export const listarElecciones = async (): Promise<Eleccion[]> => {
  const { data } = await apiClient.get<Eleccion[]>('/elecciones')
  return data
}

export const obtenerEleccion = async (
  idEleccion: number
): Promise<Eleccion> => {
  const { data } = await apiClient.get<Eleccion>(`/elecciones/${idEleccion}`)
  return data
}

export const abrirEleccion = async (idEleccion: number): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/abrir`
  )
  return data
}

export const cerrarEleccion = async (idEleccion: number): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/cerrar`
  )
  return data
}
