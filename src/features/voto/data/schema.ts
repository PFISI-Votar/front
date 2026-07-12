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

export type SeleccionesPorCategoria = Record<number, number>

export type VoterMerkleProof = {
  /** Padron leaf hash (voterLeaf for castSignedVote). */
  hashHoja: string
  merkleProof: string[]
  root: string
}
