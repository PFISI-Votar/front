import { publicApiClient } from '@/lib/public-api-client'

export type ParticipacionPublica = {
  votosFiscalizados: number
  votosEnBlanco: number
  votosNulos: number
  totalVotantesHabilitados: number
  porcentajeEscrutinio: number
}

export type ResultadoLista = {
  idLista: number
  nombre: string
  sigla: string
  color: string | null
  votos: number
  porcentaje: number
}

export type ResultadoCandidato = {
  idCandidato: number
  nombre: string
  apellido: string
  idLista: number
  nombreLista: string
  idCategoria: number
  nombreCategoria: string
  votos: number
  porcentaje: number
}

export type ResultadosPublicos = {
  porLista?: ResultadoLista[]
  porCandidato?: ResultadoCandidato[]
  votosEnBlanco: number
  votosNulos: number
}

export type DashboardEscrutinio = {
  idEleccion: number
  estado: string
  tipoVotacion: string
  participacion: ParticipacionPublica
  resultados: ResultadosPublicos | null
}

export const obtenerEscrutinioPublico = async (
  idEleccion: number
): Promise<DashboardEscrutinio> => {
  const { data } = await publicApiClient.get<DashboardEscrutinio>(
    `/elecciones/${idEleccion}/dashboard/escrutinio`
  )
  return data
}
