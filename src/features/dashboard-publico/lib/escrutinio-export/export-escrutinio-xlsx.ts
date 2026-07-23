import * as XLSX from 'xlsx'
import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const buildParticipacionSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  const { metadata, participacion } = document
  const rows = [
    ['Indicador', 'Valor'],
    ['ID Elección', metadata.idEleccion],
    ['Nombre', metadata.nombre],
    ['Estado', metadata.estado],
    ['Tipo de votación', metadata.tipoVotacion],
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

const buildResultadosPorListaSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  if (document.resultados.tipoVotacion !== TIPOS_VOTACION.POR_LISTA) {
    throw new Error('Se esperaba resultados por lista')
  }
  const { resumenPorLista, votoEnBlanco } = document.resultados
  const totalesHeader = ['Lista', 'Sigla', 'Votos', 'Porcentaje (%)']
  const totalesRows = resumenPorLista.map((lista) => [
    lista.nombreLista,
    lista.siglaLista ?? '',
    lista.totalVotosLista,
    lista.porcentaje,
  ])
  if (votoEnBlanco) {
    totalesRows.push([
      'En blanco',
      '',
      votoEnBlanco.votos,
      votoEnBlanco.porcentaje,
    ])
  }
  const integrantesHeader = [
    'Lista',
    'Sigla',
    'Categoría',
    'Apellido',
    'Nombre',
  ]
  const integrantesRows = resumenPorLista.flatMap((lista) =>
    lista.candidatos.map((candidato) => [
      lista.nombreLista,
      lista.siglaLista ?? '',
      candidato.nombreCategoria,
      candidato.apellido,
      candidato.nombre,
    ])
  )
  const data = [
    ['Totales por lista'],
    totalesHeader,
    ...totalesRows,
    [],
    ['Integrantes por lista'],
    integrantesHeader,
    ...integrantesRows,
  ]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [
    { wch: 24 },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ]
  return sheet
}

const buildResultadosPorCategoriaSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  if (document.resultados.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    throw new Error('Se esperaba resultados por categoría')
  }
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
  const baseVotosValidos = Math.max(
    0,
    document.participacion.totalVotos - document.participacion.votosNulo
  )
  const data = [
    header,
    ...rows,
    ['', '', '', '', 'TOTAL', baseVotosValidos, ''],
  ]
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

const buildResultadosSheet = (
  document: EscrutinioExportDocument
): XLSX.WorkSheet => {
  if (document.resultados.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    return buildResultadosPorListaSheet(document)
  }
  return buildResultadosPorCategoriaSheet(document)
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
