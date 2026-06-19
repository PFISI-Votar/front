import { apiClient } from '@/lib/api-client'
import type { CreateComicioInput, Eleccion } from '@/features/eleccion/data/schema'

export const crearEleccion = async (input: CreateComicioInput): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>('/elecciones', input)
  return data
}

export const listarElecciones = async (): Promise<Eleccion[]> => {
  const { data } = await apiClient.get<Eleccion[]>('/elecciones')
  return data
}

export const obtenerEleccion = async (idEleccion: number): Promise<Eleccion> => {
  const { data } = await apiClient.get<Eleccion>(`/elecciones/${idEleccion}`)
  return data
}
