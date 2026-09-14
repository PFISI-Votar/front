import { jsPDF } from 'jspdf'
import {
  MANUAL_VOTANTE_PDF_FILENAME,
  MANUAL_VOTANTE_SECTIONS,
} from '@/features/manual-votante/manual-votante-content'

const MARGIN = 18
const PAGE_BOTTOM = 280
const PAGE_TOP = 22

const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
  if (yPos + needed <= PAGE_BOTTOM) {
    return yPos
  }
  doc.addPage()
  return writeRunningHeader(doc)
}

const writeRunningHeader = (doc: jsPDF): number => {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(95, 99, 104)
  doc.text('VOTAR — Manual del votante', MARGIN, 12)
  doc.setTextColor(32, 33, 36)
  return PAGE_TOP
}

const writeWrapped = (
  doc: jsPDF,
  text: string,
  yPos: number,
  options: { size?: number; bold?: boolean; indent?: number } = {}
): number => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const indent = options.indent ?? 0
  const width = pageWidth - MARGIN * 2 - indent
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
  doc.setFontSize(options.size ?? 11)
  doc.setTextColor(32, 33, 36)
  const lines = doc.splitTextToSize(text, width) as string[]
  for (const line of lines) {
    yPos = ensureSpace(doc, yPos, 6)
    doc.text(line, MARGIN + indent, yPos)
    yPos += 5.4
  }
  return yPos
}

/**
 * VOTAR-389 — PDF descargable del manual del votante.
 * Texto real (no una imagen) para que un lector de pantalla pueda leerlo.
 * Se genera en el navegador y no se envía al servidor.
 */
export const generarManualVotantePdf = (): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setProperties({
    title: 'Manual del votante — Boleta Única Digital',
    subject:
      'Guía paso a paso para emitir el voto y verificarlo en el Portal de Transparencia',
    author: 'VOTAR',
    keywords: 'manual, votante, boleta unica digital, verificacion',
  })

  let yPos = writeRunningHeader(doc)
  yPos = writeWrapped(doc, 'Manual del votante', yPos, {
    size: 18,
    bold: true,
  })
  yPos += 2
  yPos = writeWrapped(
    doc,
    'Boleta Única Digital. Guía para votar y comprobar que el voto fue contabilizado.',
    yPos,
    { size: 11 }
  )
  yPos += 4

  for (const section of MANUAL_VOTANTE_SECTIONS) {
    const heading = section.step
      ? `${section.step}. ${section.title}`
      : section.title
    yPos = ensureSpace(doc, yPos, 14)
    yPos = writeWrapped(doc, heading, yPos, { size: 13, bold: true })
    yPos += 1
    for (const paragraph of section.body) {
      yPos = writeWrapped(doc, paragraph, yPos)
      yPos += 1.5
    }
    if (section.steps) {
      section.steps.forEach((step, index) => {
        yPos = writeWrapped(doc, `${index + 1}. ${step}`, yPos, { indent: 2 })
        yPos += 1
      })
    }
    if (section.screen && section.screen.length > 0) {
      yPos = writeWrapped(
        doc,
        `Textos de la pantalla: ${section.screen.join(' · ')}`,
        yPos,
        { size: 10, indent: 2 }
      )
      yPos += 1
    }
    if (section.note) {
      yPos = writeWrapped(doc, section.note, yPos, { size: 10 })
      yPos += 1
    }
    yPos += 3
  }

  doc.save(MANUAL_VOTANTE_PDF_FILENAME)
}
