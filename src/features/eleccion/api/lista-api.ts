import { apiClient } from '@/lib/api-client'
import type {
  CreateListaInput,
  Lista,
  ListaMapeoItem,
  OficializarResponse,
} from '../data/schema'

export const listarListas = async (idEleccion: number): Promise<Lista[]> => {
  const { data } = await apiClient.get<Lista[]>(`/elecciones/${idEleccion}/listas`)
  return data
}

export const crearLista = async (
  idEleccion: number,
  input: CreateListaInput,
): Promise<Lista> => {
  const payload = {
    ...input,
    color: input.color || undefined,
  }
  const { data } = await apiClient.post<Lista>(
    `/elecciones/${idEleccion}/listas`,
    payload,
  )
  return data
}

export const actualizarLista = async (
  idLista: number,
  input: Partial<CreateListaInput>,
): Promise<Lista> => {
  const { data } = await apiClient.patch<Lista>(`/listas/${idLista}`, input)
  return data
}

export const eliminarLista = async (idLista: number): Promise<void> => {
  await apiClient.delete(`/listas/${idLista}`)
}

export const oficializarEleccion = async (
  idEleccion: number,
): Promise<OficializarResponse> => {
  const { data } = await apiClient.post<OficializarResponse>(
    `/elecciones/${idEleccion}/oficializar`,
  )
  return data
}

export const obtenerMapeoListas = async (
  idEleccion: number,
): Promise<ListaMapeoItem[]> => {
  const { data } = await apiClient.get<ListaMapeoItem[]>(
    `/elecciones/${idEleccion}/listas/mapeo`,
  )
  return data
}
