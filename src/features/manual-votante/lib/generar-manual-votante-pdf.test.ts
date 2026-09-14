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
  const mockSplitTextToSize = vi.fn((text: string) => [text])

  return {
    mockSave,
    mockText,
    mockSetFontSize,
    mockSetFont,
    mockSetTextColor,
    mockSetProperties,
    mockAddPage,
    mockSplitTextToSize,
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
      splitTextToSize = mocks.mockSplitTextToSize
    },
  }
})

describe('generarManualVotantePdf — VOTAR-389', () => {
  beforeEach(() => {
    mocks.mockSave.mockReset()
    mocks.mockText.mockReset()
    mocks.mockSetProperties.mockReset()
  })

  it('descarga un PDF de texto con el flujo y la verificación', () => {
    generarManualVotantePdf()

    expect(mocks.mockSave).toHaveBeenCalledWith('manual-votante-bud.pdf')
    expect(mocks.mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Manual del votante — Boleta Única Digital',
      })
    )

    const written = mocks.mockText.mock.calls.map((call) => String(call[0]))
    const joined = written.join('\n')
    expect(joined).toContain('Iniciar sesión')
    expect(joined).toContain('Firmar y confirmar')
    expect(joined).toContain('Descargar comprobante PDF')
    expect(joined).toContain('Portal de Transparencia')
    expect(joined).toContain('Verificar inclusión')
    expect(joined).toContain('Inclusión confirmada')
  })
})
