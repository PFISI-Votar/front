import { votanteApiClient } from '@/lib/votante-api-client'
import type {
  BoletaDigital,
  BudConfig,
  ConfirmarVotoInput,
  ConfirmarVotoResponse,
  RegistrarVotoBlockchainInput,
  RegistrarVotoBlockchainResponse,
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

export const confirmarVoto = async (
  idEleccion: number,
  input: ConfirmarVotoInput
): Promise<ConfirmarVotoResponse> => {
  const { data } = await votanteApiClient.post<ConfirmarVotoResponse>(
    `/elecciones/${idEleccion}/votos/confirmar`,
    input
  )
  return data
}

/**
 * VOTAR-360: Registra un voto después de transmisión exitosa a blockchain.
 *
 * Llamado por bud-voting-wizard después de transmitir el voto firmado
 * a la blockchain. El backend genera el código de verificación E2E (UUID).
 */
export const registrarVotoBlockchain = async (
  idEleccion: number,
  input: RegistrarVotoBlockchainInput
): Promise<RegistrarVotoBlockchainResponse> => {
  const { data } = await votanteApiClient.post<RegistrarVotoBlockchainResponse>(
    `/elecciones/${idEleccion}/votos/registrar-blockchain`,
    input
  )
  return data
}
