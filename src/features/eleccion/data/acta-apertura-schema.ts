import type {
  ActaAperturaModo,
  ActaAperturaPlantilla,
} from '@/features/configuracion-sistema/data/schema'
import type { EleccionEstado } from '@/features/eleccion/data/schema'

export type ActaAperturaFormatoPersonalizado = {
  modo: ActaAperturaModo
  plantillaTexto: string | null
}

export type ActaAperturaDatosApertura = {
  modo: 'MANUAL' | 'AUTOMATICO'
  realizadaEn: string
  actorNombre: string | null
  actorRol: string | null
}

export type ActaAperturaPadron = {
  totalVotantesHabilitados: number
  hashPadron: string
}

export type ActaAperturaCandidato = {
  idCandidato: number
  nombreCompleto: string
  listaNombre: string | null
  listaSigla: string | null
  orden: number
}

export type ActaAperturaCategoria = {
  idCategoria: number
  nombre: string
  candidatos: ActaAperturaCandidato[]
}

export type ContratoDireccion = {
  direccion: string
  explorerUrl: string
}

export type ActaAperturaData = {
  idEleccion: number
  nombreEleccion: string
  descripcion: string | null
  estado: EleccionEstado
  fechaInicio: string
  fechaFin: string
  generadoEn: string
  datosApertura: ActaAperturaDatosApertura | null
  padron: ActaAperturaPadron
  logoUrl: string | null
  categorias: ActaAperturaCategoria[]
  merkleRoot: {
    hash: string
    publicado: boolean
    publicadoEn: string | null
  }
  red: string
  chainId: number
  contratos: {
    ballot: ContratoDireccion
    voteRegistry: ContratoDireccion
    auditView: ContratoDireccion
    merkleRootStore: ContratoDireccion
  }
  plantilla: ActaAperturaPlantilla
  formatoPersonalizado: ActaAperturaFormatoPersonalizado
}
