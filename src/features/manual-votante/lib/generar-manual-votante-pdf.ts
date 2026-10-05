import { jsPDF } from 'jspdf'
import {
  MANUAL_VOTANTE_PDF_FILENAME,
  MANUAL_VOTANTE_SECTIONS,
  type ManualVotanteSection,
} from '@/features/manual-votante/manual-votante-content'

/** Paleta alineada con la BUD / manual web. */
const COLOR = {
  brand: [47, 111, 159] as const,
  brandSoft: [215, 233, 247] as const,
  ink: [32, 33, 36] as const,
  muted: [95, 99, 104] as const,
  line: [208, 227, 240] as const,
  noteBg: [247, 251, 253] as const,
  noteBorder: [47, 111, 159] as const,
  white: [255, 255, 255] as const,
}

const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const PAGE_TOP = 24
const PAGE_BOTTOM = 278
const IMAGE_MAX_WIDTH = 92
const IMAGE_MAX_HEIGHT = PAGE_BOTTOM - PAGE_TOP - 28

type Rgb = readonly [number, number, number]

const setFill = (doc: jsPDF, rgb: Rgb) => {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

const setStroke = (doc: jsPDF, rgb: Rgb) => {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

const setText = (doc: jsPDF, rgb: Rgb) => {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

const writeRunningHeader = (doc: jsPDF): number => {
  setFill(doc, COLOR.brand)
  doc.rect(0, 0, PAGE_WIDTH, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, COLOR.brand)
  doc.text('VOTAR', MARGIN, 15)
  doc.setFont('helvetica', 'normal')
  setText(doc, COLOR.muted)
  doc.text('Manual del votante - Boleta Única Digital', MARGIN + 16, 15)
  setStroke(doc, COLOR.line)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, 18, PAGE_WIDTH - MARGIN, 18)
  setText(doc, COLOR.ink)
  return PAGE_TOP
}

const writePageNumbers = (doc: jsPDF) => {
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    setStroke(doc, COLOR.line)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, COLOR.muted)
    doc.text('VOTAR - Manual del votante', MARGIN, PAGE_HEIGHT - 8)
    doc.text(`${page} / ${total}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
      align: 'right',
    })
  }
}

const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
  if (yPos + needed <= PAGE_BOTTOM) {
    return yPos
  }
  doc.addPage()
  return writeRunningHeader(doc)
}

const writeWrapped = (
  doc: jsPDF,
  text: string,
  yPos: number,
  options: {
    size?: number
    bold?: boolean
    indent?: number
    color?: Rgb
    lineHeight?: number
  } = {}
): number => {
  const indent = options.indent ?? 0
  const width = CONTENT_WIDTH - indent
  const size = options.size ?? 10.5
  const lineHeight = options.lineHeight ?? size * 0.48
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  setText(doc, options.color ?? COLOR.ink)
  const lines = doc.splitTextToSize(text, width) as string[]
  for (const line of lines) {
    yPos = ensureSpace(doc, yPos, lineHeight + 1)
    doc.text(line, MARGIN + indent, yPos)
    yPos += lineHeight
  }
  return yPos
}

const writeCover = (doc: jsPDF): number => {
  setFill(doc, COLOR.brand)
  doc.rect(0, 0, PAGE_WIDTH, 72, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  setText(doc, COLOR.white)
  doc.text('VOTAR', MARGIN, 32)
  doc.setFontSize(16)
  doc.text('Manual del votante', MARGIN, 46)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Boleta Única Digital', MARGIN, 56)

  let yPos = 88
  yPos = writeWrapped(
    doc,
    'Guía para emitir el voto y comprobar que fue contabilizado en el Portal de Transparencia.',
    yPos,
    { size: 12, color: COLOR.ink, lineHeight: 6.2 }
  )
  yPos += 6
  yPos = writeWrapped(
    doc,
    'No hace falta saber de tecnología. Usá tu legajo, tu clave institucional y un navegador actualizado. Nadie del sistema puede ver a quién votaste.',
    yPos,
    { size: 10.5, color: COLOR.muted, lineHeight: 5.4 }
  )
  yPos += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setText(doc, COLOR.brand)
  doc.text('Contenido', MARGIN, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setText(doc, COLOR.ink)
  for (const section of MANUAL_VOTANTE_SECTIONS) {
    const label = section.step
      ? `${section.step} - ${section.title}`
      : section.title
    yPos = ensureSpace(doc, yPos, 6)
    doc.text(`•  ${label}`, MARGIN, yPos)
    yPos += 5.2
  }
  return yPos + 6
}

const writeSectionHeading = (
  doc: jsPDF,
  section: ManualVotanteSection,
  yPos: number
): number => {
  yPos = ensureSpace(doc, yPos, 14)
  const heading = section.step
    ? `${section.step} - ${section.title}`
    : section.title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setText(doc, COLOR.ink)
  doc.text(heading, MARGIN, yPos)
  yPos += 3
  setStroke(doc, COLOR.line)
  doc.setLineWidth(0.35)
  doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos)
  return yPos + 6
}

const writeSteps = (doc: jsPDF, steps: string[], yPos: number): number => {
  steps.forEach((step, index) => {
    const number = String(index + 1)
    const textWidth = CONTENT_WIDTH - 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    const lines = doc.splitTextToSize(step, textWidth) as string[]
    const blockHeight = Math.max(7, lines.length * 5.1 + 2)
    yPos = ensureSpace(doc, yPos, blockHeight + 2)

    setFill(doc, COLOR.brandSoft)
    doc.circle(MARGIN + 3.2, yPos + 1.2, 3.2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    setText(doc, COLOR.brand)
    doc.text(number, MARGIN + 3.2, yPos + 2.2, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    setText(doc, COLOR.ink)
    let lineY = yPos + 2.2
    for (const line of lines) {
      doc.text(line, MARGIN + 10, lineY)
      lineY += 5.1
    }
    yPos = lineY + 2.5
  })
  return yPos
}

const writeNote = (doc: jsPDF, note: string, yPos: number): number => {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const lines = doc.splitTextToSize(note, CONTENT_WIDTH - 10) as string[]
  const boxHeight = lines.length * 4.8 + 10
  yPos = ensureSpace(doc, yPos, boxHeight + 2)

  setFill(doc, COLOR.noteBg)
  setStroke(doc, COLOR.noteBorder)
  doc.setLineWidth(0.5)
  doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, boxHeight, 2, 2, 'FD')
  // Acento izquierdo inset para respetar el border-radius (un rect a rajatabla
  // sobresalía en las esquinas redondeadas).
  const accentW = 1.6
  const accentInset = 1.2
  setFill(doc, COLOR.brand)
  doc.roundedRect(
    MARGIN + accentInset,
    yPos + accentInset,
    accentW,
    boxHeight - accentInset * 2,
    0.8,
    0.8,
    'F'
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setText(doc, COLOR.brand)
  doc.text('Importante', MARGIN + 6, yPos + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  setText(doc, COLOR.ink)
  let lineY = yPos + 11
  for (const line of lines) {
    doc.text(line, MARGIN + 6, lineY)
    lineY += 4.8
  }
  return yPos + boxHeight + 4
}

const writeScreenLabels = (
  doc: jsPDF,
  labels: string[],
  yPos: number
): number => {
  yPos = ensureSpace(doc, yPos, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setText(doc, COLOR.muted)
  doc.text('Textos exactos de la pantalla', MARGIN, yPos)
  yPos += 8

  const chipGap = 2.2
  const chipPadX = 2.4
  const chipH = 6
  let x = MARGIN
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  for (const label of labels) {
    const textW = doc.getTextWidth(label)
    const chipW = textW + chipPadX * 2
    if (x + chipW > PAGE_WIDTH - MARGIN) {
      x = MARGIN
      yPos += chipH + chipGap
    }
    yPos = ensureSpace(doc, yPos, chipH + 2)
    setFill(doc, COLOR.brandSoft)
    doc.roundedRect(x, yPos - 4, chipW, chipH, 1.2, 1.2, 'F')
    setText(doc, COLOR.brand)
    doc.text(label, x + chipPadX, yPos)
    x += chipW + chipGap
  }
  return yPos + 6
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

const formatScreenshotCaption = (alt: string): string =>
  `Captura de pantalla - ${alt}`

const writeScreenshot = async (
  doc: jsPDF,
  shot: { src: string; alt: string },
  yPos: number
): Promise<number> => {
  const caption = formatScreenshotCaption(shot.alt)
  const dataUrl = await loadImageAsDataUrl(shot.src)
  if (!dataUrl) {
    yPos = writeWrapped(doc, caption, yPos, {
      size: 9.5,
      color: COLOR.muted,
      indent: 2,
    })
    return yPos + 2
  }

  const { width, height } = await probeImageSize(dataUrl)
  const scale = Math.min(IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  const framePad = 2
  const frameH = drawHeight + framePad * 2
  const captionReserve = 10

  yPos = ensureSpace(
    doc,
    yPos,
    Math.min(frameH + captionReserve, PAGE_BOTTOM - PAGE_TOP)
  )

  const frameX = MARGIN
  const frameW = drawWidth + framePad * 2
  yPos = ensureSpace(doc, yPos, frameH + captionReserve)

  setStroke(doc, COLOR.line)
  doc.setLineWidth(0.4)
  setFill(doc, COLOR.white)
  doc.roundedRect(frameX, yPos, frameW, frameH, 1.5, 1.5, 'FD')
  doc.addImage(
    dataUrl,
    'PNG',
    frameX + framePad,
    yPos + framePad,
    drawWidth,
    drawHeight
  )
  yPos += frameH + 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  setText(doc, COLOR.muted)
  const captionLines = doc.splitTextToSize(caption, CONTENT_WIDTH) as string[]
  for (const line of captionLines) {
    yPos = ensureSpace(doc, yPos, 5)
    doc.text(line, MARGIN, yPos)
    yPos += 4.2
  }
  return yPos + 4
}

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

  let yPos = writeCover(doc)

  for (const section of MANUAL_VOTANTE_SECTIONS) {
    yPos = ensureSpace(doc, yPos, 22)
    yPos = writeSectionHeading(doc, section, yPos)

    for (const paragraph of section.body) {
      yPos = writeWrapped(doc, paragraph, yPos, {
        size: 10.5,
        lineHeight: 5.3,
      })
      yPos += 2.2
    }

    if (section.steps && section.steps.length > 0) {
      yPos += 1
      yPos = writeSteps(doc, section.steps, yPos)
      yPos += 1
    }

    if (section.screenshots) {
      for (const shot of section.screenshots) {
        yPos = await writeScreenshot(doc, shot, yPos)
        if (shot.screen && shot.screen.length > 0) {
          yPos = writeScreenLabels(doc, shot.screen, yPos)
        }
      }
    }

    if (section.note) {
      yPos = writeNote(doc, section.note, yPos)
    }

    yPos += 6
  }

  writePageNumbers(doc)
  doc.save(MANUAL_VOTANTE_PDF_FILENAME)
}
