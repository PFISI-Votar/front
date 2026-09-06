import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActaCierreData } from '@/features/eleccion/data/acta-cierre-schema'
import {
  buildActaCierreFilename,
  construirActaCierrePdf,
} from '@/features/eleccion/lib/generar-acta-cierre-pdf'

const mocks = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockOutput = vi.fn(() => new ArrayBuffer(8))
  const mockText = vi.fn()
  const mockAddImage = vi.fn()
  const mockLoadImageAsJpegDataUrl = vi.fn()
  const mockSetFontSize = vi.fn()
  const mockSetFont = vi.fn()
  const mockSetLineWidth = vi.fn()
  const mockLine = vi.fn()
  const mockSplitTextToSize = vi.fn((text: string) => [text])
  const mockSetTextColor = vi.fn()
  const mockSetDrawColor = vi.fn()
  const mockAddPage = vi.fn()
  return {
    mockSave,
    mockOutput,
    mockText,
    mockAddImage,
    mockLoadImageAsJpegDataUrl,
    mockSetFontSize,
    mockSetFont,
    mockSetLineWidth,
    mockLine,
    mockSplitTextToSize,
    mockSetTextColor,
    mockSetDrawColor,
    mockAddPage,
  }
})

vi.mock('@/features/eleccion/lib/load-image-as-jpeg-data-url', () => ({
  loadImageAsJpegDataUrl: mocks.mockLoadImageAsJpegDataUrl,
}))

vi.mock('jspdf', () => ({
  jsPDF: class {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
    save = mocks.mockSave
    output = mocks.mockOutput
    text = mocks.mockText
    addImage = mocks.mockAddImage
    setFontSize = mocks.mockSetFontSize
    setFont = mocks.mockSetFont
    setLineWidth = mocks.mockSetLineWidth
    line = mocks.mockLine
    splitTextToSize = mocks.mockSplitTextToSize
    setTextColor = mocks.mockSetTextColor
    setDrawColor = mocks.mockSetDrawColor
    addPage = mocks.mockAddPage
  },
}))

const buildData = (
  overrides: Partial<ActaCierreData> = {}
): ActaCierreData => ({
  idEleccion: 7,
  nombreEleccion: 'Elección UTN 2026',
  descripcion: null,
  estado: 'CERRADA',
  tipoVotacion: 'POR_LISTA',
  fechaInicio: '2026-09-01T10:00:00.000Z',
  fechaFin: '2026-09-01T18:00:00.000Z',
  generadoEn: '2026-09-01T18:05:00.000Z',
  participacion: {
    totalVotos: 120,
    votosBlanco: 5,
    votosNulo: 2,
    totalVotantesHabilitados: 1500,
    porcentajeParticipacion: 8,
  },
  candidatos: [
    {
      idCandidato: 100,
      nombre: 'Juan',
      apellido: 'Pérez',
      idLista: 10,
      nombreLista: 'Lista Celeste',
      siglaLista: 'LC',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 60,
      porcentaje: 52.2,
    },
  ],
  logoUrl: null,
  merkleRoot: {
    hash: '0x' + 'ab'.repeat(32),
    publicado: true,
    publicadoEn: '2026-08-08T12:00:00.000Z',
  },
  red: 'Sepolia',
  chainId: 11155111,
  contratos: {
    ballot: {
      direccion: '0x1111111111111111111111111111111111111111',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x1111',
    },
    voteRegistry: {
      direccion: '0x2222222222222222222222222222222222222222',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x2222',
    },
    auditView: {
      direccion: '0x3333333333333333333333333333333333333333',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x3333',
    },
    merkleRootStore: {
      direccion: '0x4444444444444444444444444444444444444444',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x4444',
    },
  },
  plantilla: {
    incluirDescripcion: true,
    incluirParticipacion: true,
    incluirResultadosPorLista: true,
    incluirVerificacionCriptografica: true,
    incluirLogo: true,
  },
  formatoPersonalizado: {
    modo: 'SIMPLE',
    plantillaTexto: null,
  },
  ...overrides,
})

describe('generar-acta-cierre-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds the filename with the election id, slug and date', () => {
    const filename = buildActaCierreFilename(buildData())

    expect(filename).toBe('acta-cierre-7-eleccion-utn-2026-20260901.pdf')
  })

  it('does not save the document itself — that is the caller responsibility', async () => {
    await construirActaCierrePdf(buildData())

    expect(mocks.mockSave).not.toHaveBeenCalled()
    expect(mocks.mockText).toHaveBeenCalled()
  })

  it('includes participacion totals and the AuditView contract address', async () => {
    const data = buildData()
    await construirActaCierrePdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain(String(data.participacion.totalVotos))
    expect(renderedTexts).toContain(data.contratos.auditView.direccion)
    expect(renderedTexts).toContain(data.merkleRoot.hash)
  })

  it('renders results grouped by lista for POR_LISTA voting', async () => {
    const data = buildData()
    await construirActaCierrePdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(
      renderedTexts.some((text) => text.includes('Lista Celeste (LC)'))
    ).toBe(true)
  })

  it('omits a section when its plantilla toggle is disabled', async () => {
    const data = buildData({
      plantilla: {
        incluirDescripcion: true,
        incluirParticipacion: false,
        incluirResultadosPorLista: true,
        incluirVerificacionCriptografica: true,
        incluirLogo: true,
      },
    })
    await construirActaCierrePdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).not.toContain('Participación y escrutinio')
    expect(renderedTexts).not.toContain(String(data.participacion.totalVotos))
  })

  it('renders the interpolated custom body and skips the Simple sections when modo is PERSONALIZADO', async () => {
    const data = buildData({
      formatoPersonalizado: {
        modo: 'PERSONALIZADO',
        plantillaTexto:
          'Cierre de {{nombreEleccion}} — {{participacion.totalVotos}} votos.',
      },
    })
    await construirActaCierrePdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain('Cierre de Elección UTN 2026 — 120 votos.')
    expect(renderedTexts).not.toContain('Datos del comicio')
    expect(renderedTexts).not.toContain('Resultados del escrutinio')
  })
})
