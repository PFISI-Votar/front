import { apiClient } from '@/lib/api-client'

export interface PadronResumen {
  idPadron: number
  idEleccion: number
  totalVotantesHabilitados: number
  hashPadron: string
  estado: string
  fechaGeneracion: string
  totalProcesados: number
  totalOmitidos: number
}

export interface NovedadPadron {
  linea: number
  tipo: string
  motivo: string
}

export interface ReporteNovedades {
  idEleccion: number
  totalProcesados: number
  totalImportados: number
  totalOmitidos: number
  novedades: NovedadPadron[]
}

export interface PadronVotante {
  indiceHoja: number
  hashHoja: string
  generadoEn: string
}

export interface ListarVotantesResponse {
  items: PadronVotante[]
  total: number
  page: number
  limit: number
}

export type MerkleTreeEstado =
  | 'GENERADO'
  | 'ACTIVO'
  | 'PUBLICADO_ON_CHAIN'
  | 'OBSOLETO'

export interface MerkleResumen {
  merkleRoot: string
  totalHojas: number
  version: number
  estado: MerkleTreeEstado
  fechaGeneracion: string
  txHash?: string
  explorerUrl?: string
  fechaPublicacionOnChain?: string
  contractAddress?: string
}

export interface PublicarMerkleResponse {
  electionId: number
  merkleRoot: string
  estado: MerkleTreeEstado
  txHash: string
  blockNumber: number
  contractAddress: string
  explorerUrl: string
  publishedAt: string
}

/** Resumen del padrón de un comicio (total, estado, hash, fecha). */
export const obtenerPadronResumen = async (
  idEleccion: number
): Promise<PadronResumen> => {
  const { data } = await apiClient.get<PadronResumen>(
    `/elecciones/${idEleccion}/padron`
  )
  return data
}

/** Reporte de novedades persistido de la importación (para re-descarga). */
export const obtenerReporteNovedades = async (
  idEleccion: number
): Promise<ReporteNovedades> => {
  const { data } = await apiClient.get<ReporteNovedades>(
    `/elecciones/${idEleccion}/padron/novedades`
  )
  return data
}

/** Elimina el padrón de un comicio (sólo permitido en estado BORRADOR). */
export const eliminarPadron = async (idEleccion: number): Promise<void> => {
  await apiClient.delete(`/elecciones/${idEleccion}/padron`)
}

/** Página de hojas del padrón (índice + hash Keccak-256), para auditoría. */
export const listarPadronVotantes = async (
  idEleccion: number,
  page: number,
  limit: number
): Promise<ListarVotantesResponse> => {
  const { data } = await apiClient.get<ListarVotantesResponse>(
    `/elecciones/${idEleccion}/padron/votantes`,
    { params: { page, limit } }
  )
  return data
}

/** Sello Merkle consolidado del padrón (VOTAR-334 / US-335). */
export const obtenerMerkleResumen = async (
  idEleccion: number
): Promise<MerkleResumen> => {
  const { data } = await apiClient.get<MerkleResumen>(
    `/elecciones/${idEleccion}/padron/merkle`
  )
  return data
}

/** Publica la raíz Merkle on-chain en Sepolia (VOTAR-335). */
export const publicarMerkleOnChain = async (
  idEleccion: number
): Promise<PublicarMerkleResponse> => {
  const { data } = await apiClient.post<PublicarMerkleResponse>(
    `/elecciones/${idEleccion}/padron/merkle/publicar`
  )
  return data
}
