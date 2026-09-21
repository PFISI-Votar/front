import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generarManualVotantePdf } from '@/features/manual-votante/lib/generar-manual-votante-pdf'

const mocks = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockText = vi.fn()
  const mockSetFontSize = vi.fn()
  const mockSetFont = vi.fn()
  const mockSetTextColor = vi.fn()
  const mockSetProperties = vi.fn()
  const mockAddPage = vi.fn()
  const mockAddImage = vi.fn()
  const mockSplitTextToSize = vi.fn((text: string) => [text])
  const mockGetTextWidth = vi.fn((text: string) => String(text).length * 1.6)
  const mockSetFillColor = vi.fn()
  const mockSetDrawColor = vi.fn()
  const mockSetLineWidth = vi.fn()
  const mockRect = vi.fn()
  const mockRoundedRect = vi.fn()
  const mockCircle = vi.fn()
  const mockLine = vi.fn()
  const mockGetNumberOfPages = vi.fn(() => 1)
  const mockSetPage = vi.fn()

  return {
    mockSave,
    mockText,
    mockSetFontSize,
    mockSetFont,
    mockSetTextColor,
    mockSetProperties,
    mockAddPage,
    mockAddImage,
    mockSplitTextToSize,
    mockGetTextWidth,
    mockSetFillColor,
    mockSetDrawColor,
    mockSetLineWidth,
    mockRect,
    mockRoundedRect,
    mockCircle,
    mockLine,
    mockGetNumberOfPages,
    mockSetPage,
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

      save = mocks.mockSave
      text = mocks.mockText
      setFontSize = mocks.mockSetFontSize
      setFont = mocks.mockSetFont
      setTextColor = mocks.mockSetTextColor
      setProperties = mocks.mockSetProperties
      addPage = mocks.mockAddPage
      addImage = mocks.mockAddImage
      splitTextToSize = mocks.mockSplitTextToSize
      getTextWidth = mocks.mockGetTextWidth
      setFillColor = mocks.mockSetFillColor
      setDrawColor = mocks.mockSetDrawColor
      setLineWidth = mocks.mockSetLineWidth
      rect = mocks.mockRect
      roundedRect = mocks.mockRoundedRect
      circle = mocks.mockCircle
      line = mocks.mockLine
      getNumberOfPages = mocks.mockGetNumberOfPages
      setPage = mocks.mockSetPage
    },
  }
})

describe('generarManualVotantePdf — VOTAR-389', () => {
  beforeEach(() => {
    mocks.mockSave.mockReset()
    mocks.mockText.mockReset()
    mocks.mockSetProperties.mockReset()
    mocks.mockAddImage.mockReset()
    mocks.mockGetNumberOfPages.mockReturnValue(1)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    )
  })

  it('descarga un PDF de texto con el flujo y la verificación', async () => {
    await generarManualVotantePdf()

    expect(mocks.mockSave).toHaveBeenCalledWith('manual-votante-bud.pdf')
    expect(mocks.mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Manual del votante — Boleta Única Digital',
      })
    )

    const written = mocks.mockText.mock.calls.map((call) => String(call[0]))
    const joined = written.join('\n')
    expect(joined).toContain('Manual del votante')
    expect(joined).toContain('01 - Iniciar sesión')
    expect(joined).toContain('Firmar y confirmar')
    expect(joined).toContain('Descargar comprobante PDF')
    expect(joined).toContain('Portal de Transparencia')
    expect(joined).toContain('Verificar inclusión')
    expect(joined).toContain('Inclusión confirmada')
    expect(joined).toContain('Captura de pantalla -')
    expect(joined).toContain('Importante')
    expect(joined).toContain('Contenido')
    expect(joined).toContain('VOTAR - Manual del votante')
    expect(mocks.mockGetNumberOfPages).toHaveBeenCalled()
  })
})
