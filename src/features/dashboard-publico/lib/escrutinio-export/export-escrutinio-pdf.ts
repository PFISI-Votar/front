import { jsPDF } from 'jspdf'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

const ACCENT_COLOR: [number, number, number] = [47, 111, 159]
const MARGIN = 20
const ROW_HEIGHT = 7
const PAGE_BOTTOM = 280

const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
  if (yPos + needed <= PAGE_BOTTOM) {
    return yPos
  }
  doc.addPage()
  return MARGIN
}

export const exportEscrutinioPdf = async (
  document: EscrutinioExportDocument
): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - MARGIN * 2
  let yPos = MARGIN

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ACCENT_COLOR)
  doc.text('REPORTE DE ESCRUTINIO FINAL — VOTAR', pageWidth / 2, yPos, {
    align: 'center',
  })
  yPos += 10

  doc.setFontSize(11)
  doc.setTextColor(32, 33, 36)
  doc.setFont('helvetica', 'normal')
  doc.text('Portal de Transparencia Electoral', pageWidth / 2, yPos, {
    align: 'center',
  })
  yPos += 12

  doc.setLineWidth(0.4)
  doc.setDrawColor(...ACCENT_COLOR)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 10

  const { metadata, participacion } = document
  const metadataLines: Array<[string, string]> = [
    ['Comicio', metadata.nombre],
    ['ID Elección', String(metadata.idEleccion)],
    ['Estado', metadata.estado],
    ['Fuente', metadata.fuente],
    ['Snapshot on-chain', formatFecha(metadata.actualizadoEn)],
    ['Exportado', formatFecha(metadata.exportadoEn)],
  ]

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Metadatos del comicio', MARGIN, yPos)
  yPos += 8

  doc.setFontSize(10)
  for (const [label, value] of metadataLines) {
    yPos = ensureSpace(doc, yPos, ROW_HEIGHT + 2)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, MARGIN, yPos)
    doc.setFont('helvetica', 'normal')
    const valueLines = doc.splitTextToSize(value, contentWidth - 45)
    doc.text(valueLines, MARGIN + 40, yPos)
    yPos += Math.max(ROW_HEIGHT, valueLines.length * 5) + 1
  }

  yPos += 4
  yPos = ensureSpace(doc, yPos, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Participación', MARGIN, yPos)
  yPos += 8

  const participacionRows = [
    ['Votos emitidos', String(participacion.totalVotos)],
    ['Participación (%)', `${participacion.porcentajeParticipacion}%`],
    ['Votos en blanco', String(participacion.votosBlanco)],
    ['Votos nulos', String(participacion.votosNulo)],
    ['Votantes habilitados', String(participacion.totalVotantesHabilitados)],
  ]

  doc.setFontSize(10)
  for (const [label, value] of participacionRows) {
    yPos = ensureSpace(doc, yPos, ROW_HEIGHT)
    doc.setFont('helvetica', 'bold')
    doc.text(label, MARGIN, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, MARGIN + 55, yPos)
    yPos += ROW_HEIGHT
  }

  yPos += 6
  yPos = ensureSpace(doc, yPos, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Resultados por categoría', MARGIN, yPos)
  yPos += 8

  if (document.resumenPorCategoria.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('No hay candidatos oficializados para este comicio.', MARGIN, yPos)
    yPos += ROW_HEIGHT
  }

  for (const categoria of document.resumenPorCategoria) {
    yPos = ensureSpace(doc, yPos, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...ACCENT_COLOR)
    doc.text(
      `${categoria.nombreCategoria} (${categoria.totalVotosCategoria} votos)`,
      MARGIN,
      yPos
    )
    yPos += 7
    doc.setTextColor(32, 33, 36)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Lista', MARGIN, yPos)
    doc.text('Candidato', MARGIN + 45, yPos)
    doc.text('Votos', MARGIN + 120, yPos)
    doc.text('%', MARGIN + 140, yPos)
    yPos += 5
    doc.setLineWidth(0.2)
    doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    for (const candidato of categoria.candidatos) {
      yPos = ensureSpace(doc, yPos, ROW_HEIGHT)
      const listaLabel = candidato.siglaLista ?? candidato.nombreLista
      const candidatoLabel = `${candidato.apellido}, ${candidato.nombre}`
      doc.text(doc.splitTextToSize(listaLabel, 40), MARGIN, yPos)
      doc.text(doc.splitTextToSize(candidatoLabel, 70), MARGIN + 45, yPos)
      doc.text(String(candidato.votos), MARGIN + 120, yPos)
      doc.text(String(candidato.porcentaje), MARGIN + 140, yPos)
      yPos += ROW_HEIGHT
    }
    yPos += 4
  }

  yPos = ensureSpace(doc, yPos, 25)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(95, 99, 104)
  const footer = [
    'Fuente: ON_CHAIN · Generado localmente en el navegador.',
    'Sin datos identificatorios de votantes (Ley 25.326).',
    'Los tallies provienen del contrato AuditView en Sepolia testnet.',
  ]
  for (const line of footer) {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' })
    yPos += 4
  }

  const nombreArchivo = buildEscrutinioExportFilename(
    metadata.idEleccion,
    metadata.nombre,
    'pdf',
    new Date(metadata.exportadoEn)
  )
  doc.save(nombreArchivo)
}
