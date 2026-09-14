import type { Hex } from 'viem'
import { publicApiClient } from '@/lib/public-api-client'
import { votanteApiClient } from '@/lib/votante-api-client'
import { VOTANTE_API_TIMEOUT_MS } from '@/features/voto/crypto/constants'
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

export type RelayCastBody = {
  voterLeaf: string
  nullifier: string
  selectionHash: string
  candidateIds: string[]
  timestamp: string
  expectedSigner: string
  signature: string
  validatorSignature: string
  merkleProof: string[]
  relayToken: string
}

/** VOTAR-497 — capacidad de gas. Va con la sesión; no incluye el voto. */
export const solicitarAutorizacionRelayer = async (
  idEleccion: number
): Promise<{ relayToken: string; expiresAt: string }> => {
  const { data } = await votanteApiClient.post<{
    relayToken: string
    expiresAt: string
  }>(`/elecciones/${idEleccion}/relayer/autorizacion`)
  return data
}

/**
 * VOTAR-497 — cast sin cookie de sesión. El relayer paga el gas.
 * `credentials: omit` evita que el access log una la sesión SSO con el voto.
 */
export const postRelayerCast = async (
  idEleccion: number,
  body: RelayCastBody,
  fetchImpl: typeof fetch = fetch
): Promise<{ txHash: Hex }> => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const response = await fetchImpl(
    `${baseUrl}/elecciones/${idEleccion}/relayer/cast`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(VOTANTE_API_TIMEOUT_MS),
    }
  )
  const payload = (await response.json().catch(() => null)) as {
    txHash?: string
    message?: string
  } | null
  if (!response.ok || !payload?.txHash) {
    const error = new Error(
      payload?.message ?? `Relayer cast failed (${response.status})`
    )
    Object.assign(error, payload, { status: response.status })
    throw error
  }
  return { txHash: payload.txHash as Hex }
}

export const obtenerEstadoRevoto = async (
  idEleccion: number
): Promise<EstadoRevoto> => {
  const { data } = await votanteApiClient.get<EstadoRevoto>(
    `/elecciones/${idEleccion}/estado-revoto`
  )
  return data
}

/** VOTAR-328 / VOTAR-451 / VOTAR-452: sync consumo to on-chain count (idempotent). */
export const registrarConsumoIntento = async (
  idEleccion: number,
  votosObjetivo?: number
): Promise<EstadoRevoto> => {
  const { data } = await votanteApiClient.post<EstadoRevoto>(
    `/elecciones/${idEleccion}/estado-revoto/consumo`,
    typeof votosObjetivo === 'number' ? { votosObjetivo } : undefined
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

/**
 * VOTAR-373: indexes the confirmed vote tx for the public dashboard.
 * Separate from VOTAR-379; credentials omitted to avoid SSO linkage.
 */
export const registrarTransaccionPublica = async (
  idEleccion: number,
  txHash: string
): Promise<void> => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const response = await fetch(
    `${baseUrl}/elecciones/${idEleccion}/votos/transaccion-publica`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txHash }),
    }
  )
  if (!response.ok) {
    throw new Error(`Public transaction index failed (${response.status})`)
  }
}
