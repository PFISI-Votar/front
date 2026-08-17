import { apiClient } from '@/lib/api-client'
import type { ActaAperturaData } from '@/features/eleccion/data/acta-apertura-schema'
import type { ActaCierreData } from '@/features/eleccion/data/acta-cierre-schema'
import type {
  CreateComicioInput,
  Eleccion,
  EleccionEstado,
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

export const listarElecciones = async (
  estado?: EleccionEstado
): Promise<Eleccion[]> => {
  const { data } = await apiClient.get<Eleccion[]>('/elecciones', {
    params: estado ? { estado } : undefined,
  })
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

export const archivarEleccion = async (
  idEleccion: number
): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/archivar`
  )
  return data
}

export const obtenerActaApertura = async (
  idEleccion: number
): Promise<ActaAperturaData> => {
  const { data } = await apiClient.get<ActaAperturaData>(
    `/elecciones/${idEleccion}/acta-apertura`
  )
  return data
}

export const obtenerActaCierre = async (
  idEleccion: number
): Promise<ActaCierreData> => {
  const { data } = await apiClient.get<ActaCierreData>(
    `/elecciones/${idEleccion}/acta-cierre`
  )
  return data
}

export const registrarHashActaCierre = async (
  idEleccion: number,
  hashPdf: string
): Promise<void> => {
  await apiClient.post(`/elecciones/${idEleccion}/acta-cierre/hash`, {
    hashPdf,
  })
}
