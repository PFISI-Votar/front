import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'
import type { EscrutinioExportFormat } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import { exportEscrutinioCsv } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-csv'
import { exportEscrutinioJson } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-json'
import { exportEscrutinioPdf } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-pdf'
import { exportEscrutinioXlsx } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-xlsx'

export const exportEscrutinio = async (
  formato: EscrutinioExportFormat,
  escrutinio: Escrutinio
): Promise<void> => {
  const document = buildEscrutinioExportDocument(escrutinio, formato)
  switch (formato) {
    case 'json':
      exportEscrutinioJson(document)
      return
    case 'csv':
      exportEscrutinioCsv(document)
      return
    case 'xlsx':
      exportEscrutinioXlsx(document)
      return
    case 'pdf':
      await exportEscrutinioPdf(document)
      return
    default: {
      const exhaustiveCheck: never = formato
      throw new Error(`Formato de exportación no soportado: ${exhaustiveCheck}`)
    }
  }
}

export const puedeExportarEscrutinio = (estado: string): boolean =>
  estado === 'CERRADA' || estado === 'ESCRUTADA'
