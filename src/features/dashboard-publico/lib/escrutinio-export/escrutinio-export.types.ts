import type {
  CandidatoEscrutinio,
  ParticipacionEscrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'

export type EscrutinioExportFormat = 'xlsx' | 'pdf' | 'csv' | 'json'

export type EscrutinioResumenCategoria = {
  idCategoria: number
  nombreCategoria: string
  totalVotosCategoria: number
  candidatos: CandidatoEscrutinio[]
}

export type EscrutinioExportDocument = {
  metadata: {
    idEleccion: number
    nombre: string
    estado: string
    fuente: 'ON_CHAIN'
    actualizadoEn: string
    exportadoEn: string
    formato: EscrutinioExportFormat
    version: '1.0'
  }
  participacion: ParticipacionEscrutinio
  candidatos: CandidatoEscrutinio[]
  resumenPorCategoria: EscrutinioResumenCategoria[]
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
