import { publicApiClient } from '@/lib/public-api-client'

export type FormulaParticipacion = {
  totalPadron: number
  votosAfirmativos: number
  votosEnBlanco: number
  votosNulos: number
  totalSufragios: number
  porcentajeParticipacion: number
  expresion: string
}

export type SerieTemporalPunto = {
  etiqueta: string
  acumulado: number
  nuevos: number
}

export type DesgloseLista = {
  idLista: number
  nombreLista: string
  votos: number
}

export type DesgloseCategoria = {
  idCategoria: number
  nombreCategoria: string
  listas: DesgloseLista[]
  votosEnBlancoGlobales: number
  votosNulosGlobales: number
}

export type ParticipacionPublica = {
  idEleccion: number
  snapshotCongelado: boolean
  formula: FormulaParticipacion
  serieTemporal: SerieTemporalPunto[]
  desglosePorCategoria: DesgloseCategoria[]
  verificacionTotales: {
    coherente: boolean
    totalOnChain: number
    totalCalculado: number
  }
  fuenteDatos: string
  /** VOTAR-447: si el comicio habilita voto nulo (y su recuento en el dashboard). */
  permitirVotoNulo?: boolean
}

export const obtenerParticipacionPublica = async (
  idEleccion: number,
  horas = 12
): Promise<ParticipacionPublica> => {
  const { data } = await publicApiClient.get<ParticipacionPublica>(
    `/elecciones/${idEleccion}/participacion-publica`,
    { params: { horas } }
  )
  return data
}
