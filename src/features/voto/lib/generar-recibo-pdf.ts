import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

/**
 * VOTAR-360: datos del recibo (sin contenido del voto ni identidad).
 * Campos CA: ElectionID, TransactionHash, Timestamp, FirmaDigital.
 */
export interface DatosReciboPDF {
  idEleccion: number
  nombreEleccion: string
  txHash: string
  timestamp: string // ISO 8601
  blockNumber: number
  firmaDigital: string
}

/**
 * Genera un PDF accesible (WCAG 2.1 AA) 100% client-side.
 * No envía el PDF al servidor (CA No-almacenamiento).
 */
export async function generarReciboPDF(datos: DatosReciboPDF): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PARTICIPACIÓN ELECTORAL', pageWidth / 2, 25, {
    align: 'center',
  })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Sistema de Votación Electrónica Descentralizada',
    pageWidth / 2,
    33,
    { align: 'center' }
  )

  doc.setLineWidth(0.5)
  doc.line(marginLeft, 38, pageWidth - marginRight, 38)

  let yPos = 50

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Elección:', marginLeft, yPos)

  doc.setFont('helvetica', 'normal')
  const nombreEleccionLines = doc.splitTextToSize(
    datos.nombreEleccion,
    contentWidth - 30
  )
  doc.text(nombreEleccionLines, marginLeft + 30, yPos)
  yPos += nombreEleccionLines.length * 6 + 5

  doc.setFont('helvetica', 'bold')
  doc.text('ID Elección:', marginLeft, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`${datos.idEleccion}`, marginLeft + 30, yPos)
  yPos += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha y Hora:', marginLeft, yPos)
  doc.setFont('helvetica', 'normal')
  const fechaFormateada = new Date(datos.timestamp).toLocaleString('es-AR', {
    dateStyle: 'full',
    timeStyle: 'long',
  })
  const fechaLines = doc.splitTextToSize(fechaFormateada, contentWidth - 35)
  doc.text(fechaLines, marginLeft + 35, yPos)
  yPos += fechaLines.length * 6 + 10

  doc.setLineWidth(0.3)
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos)
  yPos += 8

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Certificado Blockchain', marginLeft, yPos)
  yPos += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Hash de Transacción:', marginLeft, yPos)
  yPos += 5

  doc.setFont('courier', 'normal')
  doc.setFontSize(9)
  const txHashLines = doc.splitTextToSize(datos.txHash, contentWidth)
  doc.text(txHashLines, marginLeft, yPos)
  yPos += txHashLines.length * 4 + 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Bloque: ${datos.blockNumber}`, marginLeft, yPos)
  yPos += 8

  doc.setFont('helvetica', 'bold')
  doc.text('FirmaDigital (sistema de auditoría):', marginLeft, yPos)
  yPos += 5

  doc.setFont('courier', 'normal')
  doc.setFontSize(8)
  const firmaLines = doc.splitTextToSize(datos.firmaDigital, contentWidth)
  doc.text(firmaLines, marginLeft, yPos)
  yPos += firmaLines.length * 3.5 + 10

  doc.setLineWidth(0.3)
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos)
  yPos += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Verificación Rápida', marginLeft, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Escanee el código QR para verificar este comprobante:',
    marginLeft,
    yPos
  )
  yPos += 8

  const urlVerificacion = `${window.location.origin}/verificar/${datos.txHash}`
  const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
    errorCorrectionLevel: 'H',
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })

  const qrSize = 50
  const qrXPos = pageWidth / 2 - qrSize / 2
  doc.addImage(qrDataUrl, 'PNG', qrXPos, yPos, qrSize, qrSize)
  yPos += qrSize + 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Código QR para verificación', pageWidth / 2, yPos, {
    align: 'center',
  })
  yPos += 6

  doc.setFont('helvetica', 'normal')
  const urlLines = doc.splitTextToSize(urlVerificacion, contentWidth)
  doc.text(urlLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += urlLines.length * 4 + 15

  doc.setLineWidth(0.3)
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANTE - Garantía de Privacidad', pageWidth / 2, yPos, {
    align: 'center',
  })
  yPos += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const disclaimer = [
    'Este comprobante certifica únicamente su participación en la elección.',
    'NO contiene información sobre su voto ni su identidad personal.',
    'Cumple con la Ley 25.326 de Protección de Datos Personales.',
    '',
    'Puede verificar la autenticidad de este documento en cualquier momento',
    'escaneando el código QR o ingresando el TransactionHash',
    'en el portal público de auditoría electoral.',
  ]

  disclaimer.forEach((line) => {
    doc.text(line, pageWidth / 2, yPos, {
      align: 'center',
      maxWidth: contentWidth,
    })
    yPos += 5
  })

  doc.setFontSize(7)
  const fechaGeneracion = new Date().toLocaleString('es-AR')
  yPos += 5
  doc.text(
    'No se ha almacenado copia en servidor. Generado localmente en el navegador.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 4
  doc.text(
    `Fecha de generación del PDF: ${fechaGeneracion}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  const shortHash = datos.txHash.replace(/^0x/i, '').slice(0, 8).toLowerCase()
  const nombreArchivo = `recibo-votacion-${datos.idEleccion}-${shortHash}.pdf`
  doc.save(nombreArchivo)
}
