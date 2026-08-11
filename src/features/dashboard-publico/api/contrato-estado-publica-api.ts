import { publicApiClient } from '@/lib/public-api-client'

export type ContratoDireccionPublica = {
  direccion: string
  explorerUrl: string
}

export type ContratoEstadoPublica = {
  idEleccion: number
  snapshotCongelado: boolean
  red: string
  chainId: number
  estadoOnChain: {
    codigo: number
    etiqueta: string
  }
  merkleRoot: {
    hash: string
    publicado: boolean
    publicadoEn: string | null
  }
  revoto: {
    habilitado: boolean
    maxVotosPorVotante: number
    minIntervaloSegundos: number
    politicaRevoto: 'LAST_VOTE_WINS' | 'DISABLED'
  }
  contratos: {
    ballot: ContratoDireccionPublica
    voteRegistry: ContratoDireccionPublica
    auditView: ContratoDireccionPublica
    merkleRootStore: ContratoDireccionPublica
  }
  fuenteDatos: string
}

export const obtenerContratoEstadoPublica = async (
  idEleccion: number
): Promise<ContratoEstadoPublica> => {
  const { data } = await publicApiClient.get<ContratoEstadoPublica>(
    `/elecciones/${idEleccion}/contrato-estado-publica`
  )
  return data
}
