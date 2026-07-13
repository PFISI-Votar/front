import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

/**
 * VOTAR-360: Interfaz de datos para generar recibo de participación electoral
 */
export interface DatosReciboPDF {
  idEleccion: number
  nombreEleccion: string
  txHash: string
  timestamp: string // ISO 8601
  codigoVerificacionE2E: string
  blockNumber?: number
  comprobanteHash: string
}

/**
 * VOTAR-360: Genera un PDF accesible (WCAG 2.1 AA) con comprobante de participación electoral.
 *
 * El recibo NO contiene el voto ni la identidad del votante (cumple Ley 25.326).
 * Se genera completamente client-side, sin enviar datos al servidor.
 *
 * Características de accesibilidad:
 * - Fuentes legibles: Helvetica 12pt (normal), 16pt+ (títulos)
 * - Contraste: 4.5:1 (texto negro sobre fondo blanco)
 * - QR Code con corrección de errores nivel H (30%)
 * - Estructura semántica clara
 *
 * @param datos - Datos del recibo (sin información del voto)
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

  // --- ENCABEZADO ---
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
    {
      align: 'center',
    }
  )

  // Línea separadora
  doc.setLineWidth(0.5)
  doc.line(marginLeft, 38, pageWidth - marginRight, 38)

  // --- INFORMACIÓN DE LA ELECCIÓN ---
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

  // --- DATOS BLOCKCHAIN ---
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

  if (datos.blockNumber) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Bloque: ${datos.blockNumber}`, marginLeft, yPos)
    yPos += 6
  }

  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Código de Verificación E2E:', marginLeft, yPos)
  yPos += 5

  doc.setFont('courier', 'normal')
  doc.setFontSize(10)
  doc.text(datos.codigoVerificacionE2E, marginLeft, yPos)
  yPos += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    `Hash del Comprobante: ${datos.comprobanteHash.substring(0, 16)}...`,
    marginLeft,
    yPos
  )
  yPos += 10

  // --- CÓDIGO QR ---
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

  // Generar QR con URL de verificación
  const urlVerificacion = `${window.location.origin}/verificar/${datos.codigoVerificacionE2E}`
  const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
    errorCorrectionLevel: 'H', // 30% error correction (WCAG compliance)
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })

  const qrSize = 50 // mm
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

  // --- DISCLAIMER DE PRIVACIDAD ---
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
    'escaneando el código QR o ingresando el código de verificación E2E',
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

  // --- DESCARGAR PDF ---
  const nombreArchivo = `recibo-votacion-${datos.idEleccion}-${datos.codigoVerificacionE2E.substring(0, 8)}.pdf`
  doc.save(nombreArchivo)
}
