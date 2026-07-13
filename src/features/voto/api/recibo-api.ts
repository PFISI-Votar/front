import { apiClient } from '@/lib/api-client'
import type { VerificarReciboResponse } from '@/features/voto/data/schema'

/**
 * VOTAR-360: API para verificación pública de recibos electorales
 */

/**
 * Verifica un recibo de participación electoral mediante su código E2E.
 * Endpoint público, no requiere autenticación.
 *
 * @param codigo - Código de verificación E2E (UUID)
 * @returns Datos del recibo sin revelar voto ni identidad
 */
export async function verificarRecibo(
  codigo: string
): Promise<VerificarReciboResponse> {
  const response = await apiClient.get<VerificarReciboResponse>(
    `/recibos/verificar/${codigo}`
  )
  return response.data
}
