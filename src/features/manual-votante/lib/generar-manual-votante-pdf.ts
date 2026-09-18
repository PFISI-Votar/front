import { jsPDF } from 'jspdf'
import {
  MANUAL_VOTANTE_PDF_FILENAME,
  MANUAL_VOTANTE_SECTIONS,
} from '@/features/manual-votante/manual-votante-content'

const MARGIN = 18
const PAGE_BOTTOM = 280
const PAGE_TOP = 22
const IMAGE_MAX_WIDTH = 174

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

const loadImageAsDataUrl = async (src: string): Promise<string | null> => {
  try {
    const response = await fetch(src)
    if (!response.ok) {
      return null
    }
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const probeImageSize = (
  dataUrl: string
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('No se pudo leer la captura'))
    image.src = dataUrl
  })

/**
 * VOTAR-389 — PDF descargable del manual del votante.
 * Texto real (no una imagen del PDF entero) para lectores de pantalla.
 * Incluye capturas de la UI (UAT-02); se genera en el navegador.
 */
export const generarManualVotantePdf = async (): Promise<void> => {
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
    if (section.screenshots) {
      for (const shot of section.screenshots) {
        const dataUrl = await loadImageAsDataUrl(shot.src)
        if (!dataUrl) {
          yPos = writeWrapped(doc, `Captura: ${shot.alt}`, yPos, {
            size: 10,
            indent: 2,
          })
          yPos += 1
          continue
        }
        const { width, height } = await probeImageSize(dataUrl)
        const drawWidth = IMAGE_MAX_WIDTH
        const drawHeight = (height / width) * drawWidth
        yPos = ensureSpace(doc, yPos, drawHeight + 10)
        yPos = writeWrapped(doc, shot.alt, yPos, { size: 9, indent: 0 })
        yPos += 1
        doc.addImage(dataUrl, 'PNG', MARGIN, yPos, drawWidth, drawHeight)
        yPos += drawHeight + 4
      }
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
