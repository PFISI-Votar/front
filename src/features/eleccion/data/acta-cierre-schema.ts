import type {
  ActaAperturaModo,
  ActaCierrePlantilla,
} from '@/features/configuracion-sistema/data/schema'
import type {
  CandidatoEscrutinio,
  ParticipacionEscrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import type { ContratoDireccion } from '@/features/eleccion/data/acta-apertura-schema'
import type { EleccionEstado } from '@/features/eleccion/data/schema'
import type { TipoVotacion } from '@/features/eleccion/lista/data/schema'

export type ActaCierreFormatoPersonalizado = {
  modo: ActaAperturaModo
  plantillaTexto: string | null
}

export type ActaCierreData = {
  idEleccion: number
  nombreEleccion: string
  descripcion: string | null
  estado: EleccionEstado
  tipoVotacion: TipoVotacion
  fechaInicio: string
  fechaFin: string
  generadoEn: string
  participacion: ParticipacionEscrutinio
  candidatos: CandidatoEscrutinio[]
  logoUrl: string | null
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
  plantilla: ActaCierrePlantilla
  formatoPersonalizado: ActaCierreFormatoPersonalizado
}
