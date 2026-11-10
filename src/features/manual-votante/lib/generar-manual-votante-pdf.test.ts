import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadImageAsJpegDataUrl } from '@/features/eleccion/lib/load-image-as-jpeg-data-url'
import { generarManualVotantePdf } from '@/features/manual-votante/lib/generar-manual-votante-pdf'
import { MANUAL_VOTANTE_SECTIONS } from '@/features/manual-votante/manual-votante-content'

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

vi.mock('@/features/eleccion/lib/load-image-as-jpeg-data-url', () => ({
  loadImageAsJpegDataUrl: vi.fn(),
}))

const JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

const totalScreenshots = MANUAL_VOTANTE_SECTIONS.reduce(
  (total, section) => total + (section.screenshots?.length ?? 0),
  0
)

describe('generarManualVotantePdf — VOTAR-389', () => {
  beforeEach(() => {
    mocks.mockSave.mockReset()
    mocks.mockText.mockReset()
    mocks.mockSetProperties.mockReset()
    mocks.mockAddImage.mockReset()
    mocks.mockGetNumberOfPages.mockReturnValue(1)
    vi.mocked(loadImageAsJpegDataUrl).mockReset()
    vi.mocked(loadImageAsJpegDataUrl).mockResolvedValue(null)
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 400
        naturalHeight = 800
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => this.onload?.())
        }
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
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

  it('agrega cada captura como JPEG cuando la conversión funciona', async () => {
    vi.mocked(loadImageAsJpegDataUrl).mockResolvedValue(JPEG_DATA_URL)

    await generarManualVotantePdf()

    expect(totalScreenshots).toBeGreaterThan(0)
    expect(mocks.mockAddImage).toHaveBeenCalledTimes(totalScreenshots)
    for (const call of mocks.mockAddImage.mock.calls) {
      expect(call[0]).toBe(JPEG_DATA_URL)
      expect(call[1]).toBe('JPEG')
    }
    expect(mocks.mockSave).toHaveBeenCalledWith('manual-votante-bud.pdf')
  })

  it('genera el PDF solo con el caption y avisa si la conversión falla', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(generarManualVotantePdf()).resolves.toBeUndefined()

    expect(mocks.mockAddImage).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(totalScreenshots)
    expect(mocks.mockSave).toHaveBeenCalledWith('manual-votante-bud.pdf')
  })
})
