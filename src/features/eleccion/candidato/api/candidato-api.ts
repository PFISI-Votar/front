import { apiClient } from '@/lib/api-client'
import type { Candidato, CreateCandidatoInput } from '@/features/eleccion/candidato/data/schema'

export const listarCandidatos = async (idLista: number): Promise<Candidato[]> => {
  const { data } = await apiClient.get<Candidato[]>(`/listas/${idLista}/candidatos`)
  return data
}

export const crearCandidato = async (
  idLista: number,
  input: CreateCandidatoInput,
): Promise<Candidato> => {
  const { data } = await apiClient.post<Candidato>(
    `/listas/${idLista}/candidatos`,
    input,
  )
  return data
}

export const actualizarCandidato = async (
  idCandidato: number,
  input: Partial<CreateCandidatoInput>,
): Promise<Candidato> => {
  const { data } = await apiClient.patch<Candidato>(
    `/candidatos/${idCandidato}`,
    input,
  )
  return data
}

export const eliminarCandidato = async (idCandidato: number): Promise<void> => {
  await apiClient.delete(`/candidatos/${idCandidato}`)
}
