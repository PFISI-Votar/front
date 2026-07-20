import { publicApiClient } from '@/lib/public-api-client'
import {
  escrutinioSchema,
  type Escrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'

/**
 * VOTAR-364: fetches public escrutinio tallies from the cached backend endpoint.
 * Never calls Sepolia RPC from the browser (UAT-02).
 */
export const obtenerEscrutinio = async (
  idEleccion: number
): Promise<Escrutinio> => {
  const { data } = await publicApiClient.get<unknown>(
    `/elecciones/${idEleccion}/resultados`
  )
  return escrutinioSchema.parse(data)
}
