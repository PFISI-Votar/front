import type {
  CandidatoEscrutinio,
  ParticipacionEscrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import type { TipoVotacion } from '@/features/eleccion/lista/data/schema'

export type EscrutinioExportFormat = 'xlsx' | 'pdf' | 'csv' | 'json'

export type EscrutinioResumenCategoria = {
  idCategoria: number
  nombreCategoria: string
  totalVotosCategoria: number
  porcentaje: number
  candidatos: CandidatoEscrutinio[]
}

export type EscrutinioResumenLista = {
  idLista: number
  nombreLista: string
  siglaLista: string | null
  colorLista: string | null
  totalVotosLista: number
  porcentaje: number
  candidatos: CandidatoEscrutinio[]
}

export type EscrutinioVotoBlanco = {
  votos: number
  porcentaje: number
}

export type EscrutinioResultadosPorLista = {
  tipoVotacion: 'POR_LISTA'
  resumenPorLista: EscrutinioResumenLista[]
  votoEnBlanco: EscrutinioVotoBlanco | null
}

export type EscrutinioResultadosPorCategoria = {
  tipoVotacion: 'POR_CANDIDATO' | 'MIXTO'
  resumenPorCategoria: EscrutinioResumenCategoria[]
  votoEnBlanco: EscrutinioVotoBlanco | null
}

export type EscrutinioExportResultados =
  EscrutinioResultadosPorLista | EscrutinioResultadosPorCategoria

export type EscrutinioExportDocument = {
  metadata: {
    idEleccion: number
    nombre: string
    estado: string
    tipoVotacion: TipoVotacion
    fuente: 'ON_CHAIN'
    actualizadoEn: string
    exportadoEn: string
    formato: EscrutinioExportFormat
    version: '1.0'
  }
  participacion: ParticipacionEscrutinio
  candidatos: CandidatoEscrutinio[]
  resultados: EscrutinioExportResultados
  /** VOTAR-447: blank always exported; null only when enabled. */
  permitirVotoNulo: boolean
}

export const ESCRUTINIO_EXPORT_FORMAT_LABELS: Record<
  EscrutinioExportFormat,
  string
> = {
  xlsx: 'Exportar Resultados en XLSX',
  pdf: 'Exportar Resultados en PDF',
  csv: 'Exportar Resultados en CSV',
  json: 'Exportar Resultados en JSON',
}
