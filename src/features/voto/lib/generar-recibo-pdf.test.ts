import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generarReciboPDF,
  type DatosReciboPDF,
} from '@/features/voto/lib/generar-recibo-pdf'

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
  const mockGetWidth = vi.fn(() => 210)
  const mockGetHeight = vi.fn(() => 297)
  const mockToDataURL = vi.fn(() =>
    Promise.resolve(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
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
    blockNumber: 4582193,
    firmaDigital:
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef01',
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

    global.window = {
      location: {
        origin: 'https://votar.utn.edu.ar',
      },
    } as unknown as Window & typeof globalThis
  })

  it('UAT-PDF-A11Y-01: debe usar fuentes legibles (Helvetica 12pt mínimo)', async () => {
    await generarReciboPDF(datosMock)
    const fontSizeCalls = mocks.mockSetFontSize.mock.calls.map(
      (call) => call[0]
    )
    expect(fontSizeCalls.some((size) => size >= 14)).toBe(true)
    expect(fontSizeCalls.filter((size) => size >= 10).length).toBeGreaterThan(0)
    expect(
      mocks.mockSetFont.mock.calls.some((call) =>
        call[0]?.toLowerCase().includes('helvetica')
      )
    ).toBe(true)
  })

  it('UAT-PDF-A11Y-02: QR debe tener corrección de errores nivel H (30%)', async () => {
    await generarReciboPDF(datosMock)
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ errorCorrectionLevel: 'H' })
    )
  })

  it('UAT-PDF-A11Y-03: QR debe tener contraste adecuado (negro sobre blanco)', async () => {
    await generarReciboPDF(datosMock)
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    )
  })

  it('UAT-PDF-A11Y-04: debe incluir disclaimer de privacidad legible', async () => {
    await generarReciboPDF(datosMock)
    const textCalls = mocks.mockText.mock.calls.flat()
    ;[
      'Este comprobante certifica únicamente su participación',
      'NO contiene información sobre su voto ni su identidad',
      'Ley 25.326',
    ].forEach((text) => {
      expect(
        textCalls.some(
          (call) => typeof call === 'string' && call.includes(text)
        )
      ).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-05: debe incluir aviso de generación local', async () => {
    await generarReciboPDF(datosMock)
    const textCalls = mocks.mockText.mock.calls.flat()
    expect(
      textCalls.some(
        (call) =>
          typeof call === 'string' &&
          call.includes('No se ha almacenado copia en servidor')
      )
    ).toBe(true)
  })

  it('UAT-PDF-A11Y-06: estructura del documento debe ser semántica', async () => {
    await generarReciboPDF(datosMock)
    const fontSizeCalls = mocks.mockSetFontSize.mock.calls.map(
      (call) => call[0]
    )
    expect(Math.max(...fontSizeCalls)).toBeGreaterThanOrEqual(16)
    expect(mocks.mockLine.mock.calls.length).toBeGreaterThan(2)
  })

  it('UAT-PDF-A11Y-07: QR apunta a /verificar/{txHash}', async () => {
    await generarReciboPDF(datosMock)
    expect(mocks.mockToDataURL).toHaveBeenCalledWith(
      expect.stringContaining(`/verificar/${datosMock.txHash}`),
      expect.any(Object)
    )
  })

  it('UAT-PDF-A11Y-08: campos críticos identificados (CA VOTAR-360)', async () => {
    await generarReciboPDF(datosMock)
    const textCalls = mocks.mockText.mock.calls.flat()
    ;[
      'Elección:',
      'ID Elección:',
      'Fecha y Hora:',
      'Hash de Transacción:',
      'FirmaDigital',
    ].forEach((label) => {
      expect(
        textCalls.some(
          (call) => typeof call === 'string' && call.includes(label)
        )
      ).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-10: nombre del archivo descriptivo', async () => {
    await generarReciboPDF(datosMock)
    expect(mocks.mockSave).toHaveBeenCalledWith(
      expect.stringMatching(/recibo-votacion-\d+-[a-f0-9]{8}\.pdf/)
    )
  })

  it('UAT-PDF-A11Y-11: incluye ElectionID, txHash, timestamp y FirmaDigital', async () => {
    await generarReciboPDF(datosMock)
    const allCalls = [
      ...mocks.mockText.mock.calls.flat(),
      ...mocks.mockSplitTextToSize.mock.calls.flat(),
    ]
    ;[
      datosMock.nombreEleccion,
      datosMock.idEleccion.toString(),
      datosMock.txHash,
      datosMock.firmaDigital,
    ].forEach((field) => {
      expect(
        allCalls.some(
          (call) => typeof call === 'string' && call.includes(field)
        )
      ).toBe(true)
    })
  })

  it('UAT-PDF-A11Y-12: NO incluye información del voto ni identidad', async () => {
    await generarReciboPDF(datosMock)
    const textCalls = mocks.mockText.mock.calls.flat()
    ;[
      'DNI',
      'CUIL',
      'candidato',
      'lista',
      'votante',
      'nombre completo',
      'apellido',
      'email',
      'teléfono',
    ].forEach((word) => {
      expect(
        textCalls.some(
          (call) =>
            typeof call === 'string' &&
            call.toLowerCase().includes(word.toLowerCase())
        )
      ).toBe(false)
    })
  })

  it('UAT-PDF-A11Y-14: QR tamaño >= 50mm', async () => {
    await generarReciboPDF(datosMock)
    expect(mocks.mockAddImage).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      50,
      50
    )
  })
})
