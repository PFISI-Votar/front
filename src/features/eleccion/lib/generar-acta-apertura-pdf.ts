import { jsPDF } from 'jspdf'
import { resolveMediaUrl } from '@/lib/media-url'
import { slugifyNombreComicio } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { ActaAperturaData } from '@/features/eleccion/data/acta-apertura-schema'
import {
  buildActaAperturaViewModel,
  formatActorApertura,
  formatFecha,
  interpolarPlantillaActaApertura,
} from '@/features/eleccion/lib/acta-apertura-template'
import { loadImageAsJpegDataUrl } from '@/features/eleccion/lib/load-image-as-jpeg-data-url'

const ACCENT_COLOR: [number, number, number] = [47, 111, 159]
const MARGIN = 20
const ROW_HEIGHT = 7
const PAGE_BOTTOM = 280

const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
  if (yPos + needed <= PAGE_BOTTOM) {
    return yPos
  }
  doc.addPage()
  return MARGIN
}

const buildActaAperturaFilename = (data: ActaAperturaData): string => {
  const slug = slugifyNombreComicio(data.nombreEleccion)
  const fecha = data.generadoEn.slice(0, 10).replace(/-/g, '')
  return `acta-apertura-${data.idEleccion}-${slug}-${fecha}.pdf`
}

const drawSectionTitle = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(32, 33, 36)
  doc.text(title, MARGIN, yPos)
  return yPos + 8
}

const drawKeyValueRows = (
  doc: jsPDF,
  rows: Array<[string, string]>,
  yPos: number,
  contentWidth: number,
  options: { monospace?: boolean; labelWidth?: number } = {}
): number => {
  const labelWidth = options.labelWidth ?? 45
  let cursor = yPos
  doc.setFontSize(10)
  for (const [label, value] of rows) {
    cursor = ensureSpace(doc, cursor, ROW_HEIGHT + 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${label}:`, MARGIN, cursor)
    if (options.monospace) {
      cursor += 4
      doc.setFont('courier', 'normal')
      doc.setFontSize(9)
      const valueLines = doc.splitTextToSize(value, contentWidth)
      doc.text(valueLines, MARGIN, cursor)
      cursor += valueLines.length * 4 + 3
    } else {
      doc.setFont('helvetica', 'normal')
      const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth)
      doc.text(valueLines, MARGIN + labelWidth, cursor)
      cursor += Math.max(ROW_HEIGHT, valueLines.length * 5) + 1
    }
  }
  return cursor
}

/**
 * Dibuja el cuerpo del modo Personalizado: el texto de la plantilla ya
 * interpolado, como párrafos con wrap automático. Los saltos de línea del
 * template se preservan (útil para bloques como `{{ofertaElectoral.texto}}`);
 * una línea en blanco se traduce en espacio extra entre párrafos.
 */
const drawCuerpoPersonalizado = (
  doc: jsPDF,
  texto: string,
  yPos: number,
  contentWidth: number
): number => {
  let cursor = yPos
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(32, 33, 36)
  for (const linea of texto.split('\n')) {
    if (linea.trim() === '') {
      cursor += 4
      continue
    }
    const wrapped = doc.splitTextToSize(linea, contentWidth)
    for (const wrappedLine of wrapped) {
      cursor = ensureSpace(doc, cursor, 6)
      doc.text(wrappedLine, MARGIN, cursor)
      cursor += 6
    }
  }
  return cursor
}

export const generarActaAperturaPdf = async (
  data: ActaAperturaData
): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - MARGIN * 2
  let yPos = MARGIN
  const { plantilla } = data

  if (plantilla.incluirLogo) {
    const logoUrl = resolveMediaUrl(data.logoUrl)
    const logoDataUrl = logoUrl ? await loadImageAsJpegDataUrl(logoUrl) : null
    if (logoDataUrl) {
      const logoSize = 20
      doc.addImage(
        logoDataUrl,
        'JPEG',
        pageWidth / 2 - logoSize / 2,
        yPos,
        logoSize,
        logoSize
      )
      yPos += logoSize + 4
    }
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ACCENT_COLOR)
  doc.text('ACTA DE APERTURA — VOTAR', pageWidth / 2, yPos, {
    align: 'center',
  })
  yPos += 10

  doc.setFontSize(11)
  doc.setTextColor(32, 33, 36)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Certificación institucional del inicio de la jornada electoral',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 12

  doc.setLineWidth(0.4)
  doc.setDrawColor(...ACCENT_COLOR)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 10

  const { formatoPersonalizado } = data
  if (
    formatoPersonalizado.modo === 'PERSONALIZADO' &&
    formatoPersonalizado.plantillaTexto
  ) {
    const viewModel = buildActaAperturaViewModel(data)
    const cuerpo = interpolarPlantillaActaApertura(
      formatoPersonalizado.plantillaTexto,
      viewModel
    )
    yPos = drawCuerpoPersonalizado(doc, cuerpo, yPos, contentWidth)
  } else {
    yPos = drawCuerpoSimple(doc, data, yPos, contentWidth)
  }

  yPos = ensureSpace(doc, yPos, 25)
  doc.setLineWidth(0.3)
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(95, 99, 104)
  const footer = [
    'Documento generado localmente en el navegador a partir de datos on-chain y off-chain.',
    'Sin datos identificatorios de votantes (Ley 25.326).',
    'La raíz de Merkle y las direcciones de contratos son verificables en Sepolia testnet.',
  ]
  for (const line of footer) {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' })
    yPos += 4
  }

  doc.save(buildActaAperturaFilename(data))
}

const drawCuerpoSimple = (
  doc: jsPDF,
  data: ActaAperturaData,
  yPosInicial: number,
  contentWidth: number
): number => {
  let yPos = yPosInicial
  const { plantilla } = data

  const metadataLines: Array<[string, string]> = [
    ['Comicio', data.nombreEleccion],
    ['ID Elección', String(data.idEleccion)],
    ['Estado', data.estado],
    ['Apertura programada', formatFecha(data.fechaInicio)],
    ['Cierre programado', formatFecha(data.fechaFin)],
    ['Acta generada', formatFecha(data.generadoEn)],
  ]
  if (plantilla.incluirDescripcion && data.descripcion) {
    metadataLines.push(['Descripción', data.descripcion])
  }

  yPos = drawSectionTitle(doc, 'Datos del comicio', yPos)
  yPos = drawKeyValueRows(doc, metadataLines, yPos, contentWidth)

  if (plantilla.incluirDatosApertura && data.datosApertura) {
    yPos += 4
    yPos = ensureSpace(doc, yPos, 20)
    yPos = drawSectionTitle(doc, 'Datos de apertura', yPos)
    const datosAperturaLines: Array<[string, string]> = [
      ['Modalidad', data.datosApertura.modo],
      ['Realizada el', formatFecha(data.datosApertura.realizadaEn)],
      ['Responsable', formatActorApertura(data.datosApertura)],
    ]
    yPos = drawKeyValueRows(doc, datosAperturaLines, yPos, contentWidth)
  }

  if (plantilla.incluirResumenPadron) {
    yPos += 4
    yPos = ensureSpace(doc, yPos, 20)
    yPos = drawSectionTitle(doc, 'Padrón electoral', yPos)
    const padronLines: Array<[string, string]> = [
      ['Votantes habilitados', String(data.padron.totalVotantesHabilitados)],
      ['Hash del padrón', data.padron.hashPadron],
    ]
    yPos = drawKeyValueRows(doc, padronLines, yPos, contentWidth, {
      labelWidth: 55,
    })
  }

  if (plantilla.incluirOfertaElectoral) {
    yPos += 2
    yPos = ensureSpace(doc, yPos, 20)
    yPos = drawSectionTitle(
      doc,
      'Oferta electoral — Candidatos postulados',
      yPos
    )

    if (data.categorias.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(
        'No hay candidatos oficializados para este comicio.',
        MARGIN,
        yPos
      )
      yPos += ROW_HEIGHT
    }
    for (const categoria of data.categorias) {
      yPos = ensureSpace(doc, yPos, 16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...ACCENT_COLOR)
      doc.text(categoria.nombre, MARGIN, yPos)
      yPos += 6
      doc.setTextColor(32, 33, 36)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      for (const candidato of categoria.candidatos) {
        yPos = ensureSpace(doc, yPos, ROW_HEIGHT)
        const listaLabel = candidato.listaSigla ?? candidato.listaNombre
        const linea = listaLabel
          ? `${candidato.nombreCompleto} (${listaLabel})`
          : candidato.nombreCompleto
        doc.text(linea, MARGIN + 4, yPos)
        yPos += ROW_HEIGHT
      }
      yPos += 3
    }
  }

  if (plantilla.incluirVerificacionCriptografica) {
    yPos += 2
    yPos = ensureSpace(doc, yPos, 40)
    yPos = drawSectionTitle(doc, 'Verificación criptográfica', yPos)

    const verificacionLines: Array<[string, string]> = [
      ['Raíz de Merkle', data.merkleRoot.hash],
      ['Anclada on-chain', data.merkleRoot.publicado ? 'Sí' : 'No'],
      ['Red', `${data.red} (chainId ${data.chainId})`],
      ['Contrato Ballot', data.contratos.ballot.direccion],
      ['Contrato VoteRegistry', data.contratos.voteRegistry.direccion],
      ['Contrato AuditView', data.contratos.auditView.direccion],
      ['Contrato MerkleRootStore', data.contratos.merkleRootStore.direccion],
    ]
    yPos = drawKeyValueRows(doc, verificacionLines, yPos, contentWidth, {
      monospace: true,
    })
  }

  return yPos
}
