import { votanteApiClient } from '@/lib/votante-api-client'
import type {
  BoletaDigital,
  BudConfig,
  VoterMerkleProof,
} from '@/features/voto/data/schema'

export const obtenerConfiguracionBud = async (
  idEleccion: number
): Promise<BudConfig> => {
  const { data } = await votanteApiClient.get<BudConfig>(
    `/elecciones/${idEleccion}/configuracion-bud`
  )
  return data
}

export const obtenerBoletaDigital = async (
  idEleccion: number
): Promise<BoletaDigital> => {
  const { data } = await votanteApiClient.get<BoletaDigital>(
    `/elecciones/${idEleccion}/boleta-digital`
  )
  return data
}

export const solicitarMerkleProof = async (
  idEleccion: number
): Promise<VoterMerkleProof> => {
  const { data } = await votanteApiClient.get<VoterMerkleProof>(
    `/elecciones/${idEleccion}/merkle-proof`
  )
  return data
}

/**
 * VOTAR-379 UAT-05: fire-and-forget anonymous vote audit.
 * Uses credentials:omit so SSO cookies are not sent with the cast notification.
 */
export const registrarVotoEmitidoAnonimo = async (
  idEleccion: number
): Promise<void> => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const response = await fetch(
    `${baseUrl}/elecciones/${idEleccion}/votos/emitido-anonimo`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    }
  )
  if (!response.ok) {
    throw new Error(`Anonymous vote audit failed (${response.status})`)
  }
}
