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
