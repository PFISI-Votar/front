import { apiClient } from '@/lib/api-client'
import type {
  Candidato,
  CreateCandidatoInput,
} from '@/features/eleccion/candidato/data/schema'

export const listarCandidatos = async (
  idLista: number
): Promise<Candidato[]> => {
  const { data } = await apiClient.get<Candidato[]>(
    `/listas/${idLista}/candidatos`
  )
  return data
}

export const crearCandidato = async (
  idLista: number,
  input: CreateCandidatoInput
): Promise<Candidato> => {
  const { fotoFile, ...candidatoInput } = input
  delete candidatoInput.removeFoto
  const { data: candidato } = await apiClient.post<Candidato>(
    `/listas/${idLista}/candidatos`,
    candidatoInput
  )
  if (fotoFile) {
    try {
      return await subirFotoCandidato(candidato.idCandidato, fotoFile)
    } catch (error) {
      await eliminarCandidato(candidato.idCandidato).catch(() => undefined)
      throw error
    }
  }
  return candidato
}

export const actualizarCandidato = async (
  idCandidato: number,
  input: Partial<CreateCandidatoInput>
): Promise<Candidato> => {
  const { fotoFile, removeFoto, ...candidatoInput } = input
  const { data: candidato } = await apiClient.patch<Candidato>(
    `/candidatos/${idCandidato}`,
    candidatoInput
  )
  if (fotoFile) {
    return subirFotoCandidato(idCandidato, fotoFile)
  }
  if (removeFoto) {
    return eliminarFotoCandidato(idCandidato)
  }
  return candidato
}

export const eliminarCandidato = async (idCandidato: number): Promise<void> => {
  await apiClient.delete(`/candidatos/${idCandidato}`)
}

export const subirFotoCandidato = async (
  idCandidato: number,
  file: File
): Promise<Candidato> => {
  const formData = new FormData()
  formData.append('foto', file)
  const { data } = await apiClient.patch<Candidato>(
    `/candidatos/${idCandidato}/foto`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export const eliminarFotoCandidato = async (
  idCandidato: number
): Promise<Candidato> => {
  const { data } = await apiClient.delete<Candidato>(
    `/candidatos/${idCandidato}/foto`
  )
  return data
}
