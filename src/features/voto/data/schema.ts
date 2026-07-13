export const CATEGORIA_BOLETA_ESTADO = {
  DISPONIBLE: 'DISPONIBLE',
  SIN_CANDIDATOS: 'SIN_CANDIDATOS',
} as const

export type CategoriaBoletaEstado =
  (typeof CATEGORIA_BOLETA_ESTADO)[keyof typeof CATEGORIA_BOLETA_ESTADO]

export type CandidatoBoletaDigital = {
  idCandidato: number
  idCategoria: number
  idLista: number
  listId: number
  nombre: string
  apellido: string
  nombreCompleto: string
  agrupacionPolitica: string
  numeroLista: number
  colorLista?: string | null
  imagenListaUrl?: string | null
  logoListaUrl?: string | null
  fotoListaUrl?: string | null
  fotoUrl: string | null
}

export type CategoriaBoletaDigital = {
  idCategoria: number
  nombre: string
  descripcion: string | null
  orden: number
  estado: CategoriaBoletaEstado
  candidatos: CandidatoBoletaDigital[]
}

export type BoletaDigital = {
  idEleccion: number
  nombreEleccion: string
  estadoEleccion: string
  idBoleta: number
  titulo: string
  permitirVotoEnBlanco: boolean
  categorias: CategoriaBoletaDigital[]
}

export type BudConfig = {
  idEleccion: number
  nombre: string
  estado: string
  tipoVotacion: string
  metodosAutenticacion: string[]
}

export type SeleccionVoto = {
  idCategoria: number
  idCandidato: number
}

export type ConfirmarVotoInput = {
  idempotencyKey: string
  selecciones: SeleccionVoto[]
  votoEnBlanco?: boolean
}

export type ConfirmarVotoResponse = {
  idEleccion: number
  estado: string
  comprobanteHash: string
  payloadHash: string
  recibidoEn: string
  idempotente: boolean
  // VOTAR-360: Campos de recibo blockchain
  txHash?: string
  blockNumber?: number
  contractAddress?: string
  codigoVerificacionE2E: string
  txStatus?: string
}

export type SeleccionesPorCategoria = Record<number, number>

export type VoterMerkleProof = {
  /** Padron leaf hash (voterLeaf for castSignedVote). */
  hashHoja: string
  merkleProof: string[]
  root: string
}

// VOTAR-360: Respuesta de verificación de recibo electoral
export type VerificarReciboResponse = {
  idEleccion: number
  nombreEleccion: string
  recibidoEn: string
  txHash?: string
  blockNumber?: number
  estadoTx?: string
  urlExploradorBlockchain?: string
  contractAddress?: string
  comprobanteHash: string
}

// VOTAR-360: Registro de voto blockchain (wizard)
export type RegistrarVotoBlockchainInput = {
  txHash: string
  blockNumber: number
  nullifier: string
  selectionHash: string
  timestamp: number
  contractAddress?: string
  categorias: number[]
}

export type RegistrarVotoBlockchainResponse = {
  idEleccion: number
  estado: string
  comprobanteHash: string
  payloadHash: string
  recibidoEn: string
  codigoVerificacionE2E: string
  txHash: string
  blockNumber: number
  txStatus: string
  contractAddress?: string
}
