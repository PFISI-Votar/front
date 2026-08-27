import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import { escapeCsvCell } from '@/features/dashboard-publico/lib/escrutinio-export/sanitize-csv-cell'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const UTF8_BOM = '\uFEFF'

const buildMetadataSection = (document: EscrutinioExportDocument): string => {
  const { metadata, participacion, permitirVotoNulo } = document
  const rows: Array<[string, string | number]> = [
    ['clave', 'valor'],
    ['id_eleccion', metadata.idEleccion],
    ['nombre', metadata.nombre],
    ['estado', metadata.estado],
    ['tipo_votacion', metadata.tipoVotacion],
    ['fuente', metadata.fuente],
    ['actualizado_en', metadata.actualizadoEn],
    ['exportado_en', metadata.exportadoEn],
    ['version', metadata.version],
    ['total_votos', participacion.totalVotos],
    ['porcentaje_participacion', participacion.porcentajeParticipacion],
    ['votos_blanco', participacion.votosBlanco],
  ]
  if (permitirVotoNulo) {
    rows.push(['votos_nulo', participacion.votosNulo])
  }
  rows.push([
    'total_votantes_habilitados',
    participacion.totalVotantesHabilitados,
  ])
  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}

const buildResultadosPorListaSection = (
  document: EscrutinioExportDocument
): string => {
  if (document.resultados.tipoVotacion !== TIPOS_VOTACION.POR_LISTA) {
    throw new Error('Se esperaba resultados por lista')
  }
  const totalesHeader = ['lista', 'sigla_lista', 'votos', 'porcentaje']
  const totalesRows = document.resultados.resumenPorLista.map((lista) => [
    lista.nombreLista,
    lista.siglaLista ?? '',
    lista.totalVotosLista,
    lista.porcentaje,
  ])
  if (document.resultados.votoEnBlanco) {
    totalesRows.push([
      'En blanco',
      '',
      document.resultados.votoEnBlanco.votos,
      document.resultados.votoEnBlanco.porcentaje,
    ])
  }
  const integrantesHeader = [
    'lista',
    'sigla_lista',
    'categoria',
    'candidato_apellido',
    'candidato_nombre',
  ]
  const integrantesRows = document.resultados.resumenPorLista.flatMap((lista) =>
    lista.candidatos.map((candidato) => [
      lista.nombreLista,
      lista.siglaLista ?? '',
      candidato.nombreCategoria,
      candidato.apellido,
      candidato.nombre,
    ])
  )
  const sections = [
    ['totales_por_lista'],
    totalesHeader,
    ...totalesRows,
    [],
    ['integrantes_por_lista'],
    integrantesHeader,
    ...integrantesRows,
  ]
  return sections
    .map((row) =>
      Array.isArray(row)
        ? row.map((cell) => escapeCsvCell(cell)).join(',')
        : escapeCsvCell(row)
    )
    .join('\n')
}

const buildResultadosPorCategoriaSection = (
  document: EscrutinioExportDocument
): string => {
  if (document.resultados.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    throw new Error('Se esperaba resultados por categoría')
  }
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
  if (document.resultados.votoEnBlanco) {
    rows.push([
      'En blanco',
      '',
      '',
      '',
      '',
      document.resultados.votoEnBlanco.votos,
      document.resultados.votoEnBlanco.porcentaje,
    ])
  }
  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}

const buildResultadosSection = (document: EscrutinioExportDocument): string => {
  if (document.resultados.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    return buildResultadosPorListaSection(document)
  }
  return buildResultadosPorCategoriaSection(document)
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
