import * as XLSX from 'xlsx'
import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

const buildParticipacionSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  const { metadata, participacion } = document
  const rows = [
    ['Indicador', 'Valor'],
    ['ID Elección', metadata.idEleccion],
    ['Nombre', metadata.nombre],
    ['Estado', metadata.estado],
    ['Fuente', metadata.fuente],
    ['Actualizado en', metadata.actualizadoEn],
    ['Exportado en', metadata.exportadoEn],
    ['Total votos', participacion.totalVotos],
    ['Participación (%)', participacion.porcentajeParticipacion],
    ['Votos en blanco', participacion.votosBlanco],
    ['Votos nulos', participacion.votosNulo],
    ['Votantes habilitados', participacion.totalVotantesHabilitados],
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [{ wch: 28 }, { wch: 40 }]
  return sheet
}

const buildResultadosSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  const header = [
    'Categoría',
    'Lista',
    'Sigla',
    'Apellido',
    'Nombre',
    'Votos',
    'Porcentaje (%)',
  ]
  const rows = document.candidatos.map((candidato) => [
    candidato.nombreCategoria,
    candidato.nombreLista,
    candidato.siglaLista ?? '',
    candidato.apellido,
    candidato.nombre,
    candidato.votos,
    candidato.porcentaje,
  ])
  const totalVotos = document.participacion.totalVotos
  const data = [header, ...rows, ['', '', '', '', 'TOTAL', totalVotos, '']]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
  ]
  return sheet
}

export const buildEscrutinioXlsxBuffer = (
  document: EscrutinioExportDocument
): ArrayBuffer => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    buildParticipacionSheet(document),
    'Participación'
  )
  XLSX.utils.book_append_sheet(
    workbook,
    buildResultadosSheet(document),
    'Resultados'
  )
  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
}

export const exportEscrutinioXlsx = (
  document: EscrutinioExportDocument
): void => {
  const buffer = buildEscrutinioXlsxBuffer(document)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const nombreArchivo = buildEscrutinioExportFilename(
    document.metadata.idEleccion,
    document.metadata.nombre,
    'xlsx',
    new Date(document.metadata.exportadoEn)
  )
  descargarArchivo(blob, nombreArchivo)
}
