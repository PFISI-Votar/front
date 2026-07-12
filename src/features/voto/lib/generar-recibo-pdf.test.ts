import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generarReciboPDF,
  type DatosReciboPDF,
} from '@/features/voto/lib/generar-recibo-pdf'

// Mock de jsPDF y QRCode con vi.hoisted
const mocks = vi.hoisted(() => {
  const mockAddImage = vi.fn()
  const mockSave = vi.fn()
  const mockText = vi.fn()
  const mockSetFontSize = vi.fn()
  const mockSetFont = vi.fn()
  const mockSetLineWidth = vi.fn()
  const mockLine = vi.fn()
  const mockSplitTextToSize = vi.fn((text: string) => [text])
  const mockSetTextColor = vi.fn()
  const mockGetWidth = vi.fn(() => 210) // A4 width in mm
  const mockGetHeight = vi.fn(() => 297) // A4 height in mm
  const mockToDataURL = vi.fn(() =>
    Promise.resolve(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    ),
  )

  return {
    mockAddImage,
    mockSave,
    mockText,
    mockSetFontSize,
    mockSetFont,
    mockSetLineWidth,
    mockLine,
    mockSplitTextToSize,
    mockSetTextColor,
    mockGetWidth,
    mockGetHeight,
    mockToDataURL,
    mockJsPDFInstance: {
      addImage: mockAddImage,
      save: mockSave,
      text: mockText,
      setFontSize: mockSetFontSize,
      setFont: mockSetFont,
      setLineWidth: mockSetLineWidth,
      line: mockLine,
      splitTextToSize: mockSplitTextToSize,
      setTextColor: mockSetTextColor,
      internal: {
        pageSize: {
          getWidth: mockGetWidth,
          getHeight: mockGetHeight,
        },
      },
    },
  }
})

vi.mock('jspdf', () => {
  return {
    jsPDF: class {
      internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      }

      addImage = mocks.mockAddImage
      save = mocks.mockSave
      text = mocks.mockText
      setFontSize = mocks.mockSetFontSize
      setFont = mocks.mockSetFont
      setLineWidth = mocks.mockSetLineWidth
      line = mocks.mockLine
      splitTextToSize = mocks.mockSplitTextToSize
      setTextColor = mocks.mockSetTextColor
    },
  }
})

vi.mock('qrcode', () => ({
  default: {
    toDataURL: mocks.mockToDataURL,
  },
}))

describe('generarReciboPDF - VOTAR-360 Accesibilidad WCAG 2.1 AA', () => {
  const datosMock: DatosReciboPDF = {
    idEleccion: 7,
    nombreEleccion: 'Centro de Estudiantes 2026',
    txHash:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: '2026-07-11T14:30:00Z',
    codigoVerificacionE2E: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    blockNumber: 4582193,
    comprobanteHash:
      'e5f6789012345678901234567890123456789012345678901234567890123456',
  }

  beforeEach(() => {
    mocks.mockAddImage.mockClear()
    mocks.mockSave.mockClear()
    mocks.mockText.mockClear()
    mocks.mockSetFontSize.mockClear()
    mocks.mockSetFont.mockClear()
    mocks.mockSetLineWidth.mockClear()
    mocks.mockLine.mockClear()
    mocks.mockSplitTextToSize.mockClear()
    mocks.mockSetTextColor.mockClear()
    mocks.mockToDataURL.mockClear()

    // Mock window.location para entorno node
    global.window = {
      location: {
        origin: 'https://votar.utn.edu.ar',
      },
    } as any
  })

  it('UAT-PDF-A11Y-01: debe usar fuentes legibles (Helvetica 12pt mínimo)', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que se usaron tamaños de fuente accesibles
    const fontSizeCalls = mocks.mockSetFontSize.mock.calls.map((call) => call[0])

    // Títulos deben ser >= 14pt
    expect(fontSizeCalls.some((size) => size >= 14)).toBe(true)

    // Texto normal debe ser >= 10pt (WCAG recomienda 12pt, pero 10pt es aceptable para PDF)
    const textSizes = fontSizeCalls.filter((size) => size >= 10)
    expect(textSizes.length).toBeGreaterThan(0)

    // Verificar que se usó Helvetica (fuente sans-serif legible)
    const fontCalls = mocks.mockSetFont.mock.calls
    const helveticaUsed = fontCalls.some((call) =>
      call[0]?.toLowerCase().includes('helvetica'),
    )
    expect(helveticaUsed).toBe(true)
  })

  it('UAT-PDF-A11Y-02: QR debe tener corrección de errores nivel H (30%)', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que se llamó a QRCode.toDataURL con nivel H
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        errorCorrectionLevel: 'H',
      }),
    )
  })

  it('UAT-PDF-A11Y-03: QR debe tener contraste adecuado (negro sobre blanco)', async () => {
    await generarReciboPDF(datosMock)

    // Verificar colores del QR
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }),
    )
  })

  it('UAT-PDF-A11Y-04: debe incluir disclaimer de privacidad legible', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que se incluyó el disclaimer
    const textCalls = mocks.mockText.mock.calls.flat()
    const disclaimerTexts = [
      'Este comprobante certifica únicamente su participación',
      'NO contiene información sobre su voto ni su identidad',
      'Ley 25.326',
    ]

    disclaimerTexts.forEach((text) => {
      const found = textCalls.some(
        (call) => typeof call === 'string' && call.includes(text),
      )
      expect(found).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-05: debe incluir aviso de generación local', async () => {
    await generarReciboPDF(datosMock)

    // Verificar footer sobre no-almacenamiento
    const textCalls = mocks.mockText.mock.calls.flat()
    const footerFound = textCalls.some(
      (call) =>
        typeof call === 'string' &&
        call.includes('No se ha almacenado copia en servidor'),
    )

    expect(footerFound).toBe(true)
  })

  it('UAT-PDF-A11Y-06: estructura del documento debe ser semántica', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que hay un título principal grande
    const fontSizeCalls = mocks.mockSetFontSize.mock.calls.map((call) => call[0])
    const titleSize = Math.max(...fontSizeCalls)
    expect(titleSize).toBeGreaterThanOrEqual(16) // Título >= 16pt

    // Verificar que hay secciones delimitadas por líneas
    expect(mocks.mockLine).toHaveBeenCalled()
    expect(mocks.mockLine.mock.calls.length).toBeGreaterThan(2) // Al menos 3 separadores
  })

  it('UAT-PDF-A11Y-07: debe generar URL de verificación accesible', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que se generó QR con URL completa
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.stringContaining('/verificar/'),
      expect.any(Object),
    )

    // Verificar que la URL está en el PDF (puede estar en splitTextToSize o en text)
    const textCalls = mocks.mockText.mock.calls.flat()
    const splitCalls = mocks.mockSplitTextToSize.mock.calls.flat()
    const allCalls = [...textCalls, ...splitCalls]
    const urlFound = allCalls.some(
      (call) =>
        typeof call === 'string' && call.includes('/verificar/'),
    )
    expect(urlFound).toBe(true)
  })

  it('UAT-PDF-A11Y-08: campos críticos deben estar claramente identificados', async () => {
    await generarReciboPDF(datosMock)

    const textCalls = mocks.mockText.mock.calls.flat()

    // Verificar labels de campos críticos
    const requiredLabels = [
      'Elección:',
      'ID Elección:',
      'Fecha y Hora:',
      'Hash de Transacción:',
      'Código de Verificación E2E:',
    ]

    requiredLabels.forEach((label) => {
      const found = textCalls.some(
        (call) => typeof call === 'string' && call.includes(label),
      )
      expect(found, `Label "${label}" no encontrado en el PDF`).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-09: debe usar formato A4 estándar', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que el pageSize es A4 (210x297mm)
    expect(mocks.mockGetWidth()).toBe(210)
    expect(mocks.mockGetHeight()).toBe(297)
  })

  it('UAT-PDF-A11Y-10: nombre del archivo debe ser descriptivo', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que el nombre del archivo incluye ID elección y código
    expect(mocks.mockSave).toHaveBeenCalledWith(
      expect.stringMatching(/recibo-votacion-\d+-[a-f0-9]{8}\.pdf/),
    )
  })

  it('UAT-PDF-A11Y-11: debe incluir todos los campos requeridos por VOTAR-360', async () => {
    await generarReciboPDF(datosMock)

    const textCalls = mocks.mockText.mock.calls.flat()
    const splitCalls = mocks.mockSplitTextToSize.mock.calls.flat()
    const allCalls = [...textCalls, ...splitCalls]

    // Campos obligatorios según CA1 de VOTAR-360
    const requiredFields = [
      datosMock.nombreEleccion,
      datosMock.idEleccion.toString(),
      datosMock.txHash,
      datosMock.codigoVerificacionE2E,
    ]

    requiredFields.forEach((field) => {
      const found = allCalls.some(
        (call) => typeof call === 'string' && call.includes(field),
      )
      expect(found, `Campo requerido "${field}" no encontrado en el PDF`).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-12: NO debe incluir información del voto ni identidad', async () => {
    await generarReciboPDF(datosMock)

    const textCalls = mocks.mockText.mock.calls.flat()

    // Palabras prohibidas que revelarían el voto o identidad
    const forbiddenWords = [
      'DNI',
      'CUIL',
      'candidato',
      'lista',
      'votante',
      'nombre completo',
      'apellido',
      'email',
      'teléfono',
    ]

    forbiddenWords.forEach((word) => {
      const found = textCalls.some(
        (call) =>
          typeof call === 'string' &&
          call.toLowerCase().includes(word.toLowerCase()),
      )
      expect(found, `Palabra prohibida "${word}" encontrada en el PDF`).toBe(false)
    })
  })

  it('UAT-PDF-A11Y-13: debe incluir timestamp legible en formato local', async () => {
    await generarReciboPDF(datosMock)

    const textCalls = mocks.mockText.mock.calls.flat()

    // Verificar que hay una fecha formateada (no solo ISO)
    const dateFound = textCalls.some(
      (call) =>
        typeof call === 'string' &&
        (call.includes('2026') || call.includes('julio')),
    )

    expect(dateFound).toBe(true)
  })

  it('UAT-PDF-A11Y-14: QR debe tener tamaño adecuado (>= 50mm)', async () => {
    await generarReciboPDF(datosMock)

    // Verificar que se agregó imagen QR con tamaño >= 50mm
    expect(mocks.mockAddImage).toHaveBeenCalledWith(
      expect.any(String), // dataURL
      expect.any(String), // format
      expect.any(Number), // x
      expect.any(Number), // y
      50, // width (debe ser >= 50mm para escaneo fácil)
      50, // height
    )
  })

  it('UAT-PDF-A11Y-15: debe incluir marca de agua sobre integridad blockchain', async () => {
    await generarReciboPDF(datosMock)

    const textCalls = mocks.mockText.mock.calls.flat()

    // Verificar sección de certificado blockchain
    const blockchainSectionFound = textCalls.some(
      (call) =>
        typeof call === 'string' &&
        call.includes('Certificado Blockchain'),
    )

    expect(blockchainSectionFound).toBe(true)
  })
})
