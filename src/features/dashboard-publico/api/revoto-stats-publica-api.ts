import { publicApiClient } from '@/lib/public-api-client'

export type RevotoOverwriteTimelinePunto = {
  etiqueta: string
  overwriteRatio: number
  totalRevotes: number
  totalEventos: number
}

export type RevotoStatsPublica = {
  idEleccion: number
  snapshotCongelado: boolean
  totalRevotes: number
  uniqueVoters: number
  overwriteRatio: number
  serieTemporal: RevotoOverwriteTimelinePunto[]
  fuenteDatos: string
}

export const obtenerRevotoStatsPublica = async (
  idEleccion: number,
  horas = 12
): Promise<RevotoStatsPublica> => {
  const { data } = await publicApiClient.get<RevotoStatsPublica>(
    `/elecciones/${idEleccion}/revoto-stats-publica`,
    { params: { horas } }
  )
  return data
}
