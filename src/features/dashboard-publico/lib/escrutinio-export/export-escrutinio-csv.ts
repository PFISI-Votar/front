import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import { escapeCsvCell } from '@/features/dashboard-publico/lib/escrutinio-export/sanitize-csv-cell'

const UTF8_BOM = '\uFEFF'

const buildMetadataSection = (document: EscrutinioExportDocument): string => {
  const { metadata, participacion } = document
  const rows = [
    ['clave', 'valor'],
    ['id_eleccion', metadata.idEleccion],
    ['nombre', metadata.nombre],
    ['estado', metadata.estado],
    ['fuente', metadata.fuente],
    ['actualizado_en', metadata.actualizadoEn],
    ['exportado_en', metadata.exportadoEn],
    ['version', metadata.version],
    ['total_votos', participacion.totalVotos],
    ['porcentaje_participacion', participacion.porcentajeParticipacion],
    ['votos_blanco', participacion.votosBlanco],
    ['votos_nulo', participacion.votosNulo],
    ['total_votantes_habilitados', participacion.totalVotantesHabilitados],
  ]
  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}

const buildResultadosSection = (document: EscrutinioExportDocument): string => {
  const header = [
    'categoria',
    'lista',
    'sigla_lista',
    'candidato_apellido',
    'candidato_nombre',
    'votos',
    'porcentaje',
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
  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}

export const buildEscrutinioCsvContent = (
  document: EscrutinioExportDocument
): string => {
  const metadataSection = buildMetadataSection(document)
  const resultadosSection = buildResultadosSection(document)
  return `${metadataSection}\n\n${resultadosSection}\n`
}

export const exportEscrutinioCsv = (
  document: EscrutinioExportDocument
): void => {
  const contenido = `${UTF8_BOM}${buildEscrutinioCsvContent(document)}`
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const nombreArchivo = buildEscrutinioExportFilename(
    document.metadata.idEleccion,
    document.metadata.nombre,
    'csv',
    new Date(document.metadata.exportadoEn)
  )
  descargarArchivo(blob, nombreArchivo)
}
