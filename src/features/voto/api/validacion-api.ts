import type { Hex } from 'viem'
import { votanteApiClient } from '@/lib/votante-api-client'

/**
 * VOTAR-377 — cliente de la "Entidad de Firmas Digitales" (Tercero de Confianza).
 *
 * FASE 1 es autenticada (cookie de votante): valida la pertenencia al padrón y
 * registra keccak256(secreto). FASE 2 es ANÓNIMA (credentials:'omit', sin cookie):
 * revela el secreto junto con el payload completo y recibe la firma institucional.
 * El backend nunca ve identidad y selección en la misma llamada (Blind Signing).
 */

export type CredencialEmitida = {
  expiraEn: string
}

export type SolicitudFirmaValidacion = {
  secreto: Hex
  nullifier: Hex
  selectionHash: Hex
  candidateId: string
  timestamp: number
  expectedSigner: Hex
}

export type FirmaValidacion = {
  firmaValidacion: Hex
  direccionValidador: Hex
  algoritmo: string
}

/** FASE 1 — autenticada. */
export const emitirCredencialValidacion = async (
  idEleccion: number,
  commit: Hex
): Promise<CredencialEmitida> => {
  const { data } = await votanteApiClient.post<CredencialEmitida>(
    `/elecciones/${idEleccion}/validacion/credencial`,
    { commit }
  )
  return data
}

/**
 * FASE 2 — anónima. `credentials: 'omit'` es deliberado: la certificación de
 * legitimidad no debe viajar junto a la sesión SSO (AC-3 / VOTAR-379).
 */
export const solicitarFirmaValidacion = async (
  idEleccion: number,
  solicitud: SolicitudFirmaValidacion
): Promise<FirmaValidacion> => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const response = await fetch(
    `${baseUrl}/validacion/elecciones/${idEleccion}/firma`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(solicitud),
    }
  )
  if (!response.ok) {
    throw new Error(`Validator signature request failed (${response.status})`)
  }
  return (await response.json()) as FirmaValidacion
}
