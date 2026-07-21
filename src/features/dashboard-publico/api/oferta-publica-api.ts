import { publicApiClient } from '@/lib/public-api-client'
import type { BoletaDigital } from '@/features/voto/data/schema'

/**
 * Catálogo público de listas y candidatos oficializados (VOTAR-368).
 * Usa publicApiClient: sin cookies ni refresh de sesión.
 */
export const obtenerOfertaPublica = async (
  idEleccion: number
): Promise<BoletaDigital> => {
  const { data } = await publicApiClient.get<BoletaDigital>(
    `/elecciones/${idEleccion}/oferta-oficializada`
  )
  return data
}
