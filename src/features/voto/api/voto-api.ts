import { publicApiClient } from '@/lib/public-api-client'
import { votanteApiClient } from '@/lib/votante-api-client'
import type {
  BoletaDigital,
  BudConfig,
  EstadoRevoto,
  VoterMerkleProof,
} from '@/features/voto/data/schema'

/** Configuración pública del comicio (BUD + dashboard anónimo, VOTAR-315). */
export const obtenerConfiguracionBud = async (
  idEleccion: number
): Promise<BudConfig> => {
  const { data } = await publicApiClient.get<BudConfig>(
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

/** VOTAR-328: consulta transparente a revotePolicyService. */
export const obtenerEstadoRevoto = async (
  idEleccion: number
): Promise<EstadoRevoto> => {
  const { data } = await votanteApiClient.get<EstadoRevoto>(
    `/elecciones/${idEleccion}/estado-revoto`
  )
  return data
}

/** VOTAR-328: registra consumo de intento tras cast on-chain (antes del logout). */
export const registrarConsumoIntento = async (
  idEleccion: number
): Promise<EstadoRevoto> => {
  const { data } = await votanteApiClient.post<EstadoRevoto>(
    `/elecciones/${idEleccion}/estado-revoto/consumo`
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
