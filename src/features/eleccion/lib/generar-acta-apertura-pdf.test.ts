import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActaAperturaData } from '@/features/eleccion/data/acta-apertura-schema'
import { generarActaAperturaPdf } from '@/features/eleccion/lib/generar-acta-apertura-pdf'

const mocks = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockText = vi.fn()
  const mockAddImage = vi.fn()
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
    mockText,
    mockAddImage,
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

vi.mock('jspdf', () => ({
  jsPDF: class {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
    save = mocks.mockSave
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
  overrides: Partial<ActaAperturaData> = {}
): ActaAperturaData => ({
  idEleccion: 7,
  nombreEleccion: 'Elección UTN 2026',
  descripcion: null,
  estado: 'ABIERTA',
  fechaInicio: '2026-09-01T10:00:00.000Z',
  fechaFin: '2026-09-01T18:00:00.000Z',
  generadoEn: '2026-09-01T10:05:00.000Z',
  datosApertura: {
    modo: 'MANUAL',
    realizadaEn: '2026-09-01T10:00:12.000Z',
    actorNombre: 'Ana Gómez',
    actorRol: 'ELECTION_ADMIN',
  },
  padron: {
    totalVotantesHabilitados: 1500,
    hashPadron: 'a1b2c3d4',
  },
  logoUrl: null,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      candidatos: [
        {
          idCandidato: 100,
          nombreCompleto: 'Pérez, Juan',
          listaNombre: 'Lista Celeste',
          listaSigla: 'LC',
          orden: 1,
        },
      ],
    },
  ],
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
    incluirDatosApertura: true,
    incluirResumenPadron: true,
    incluirOfertaElectoral: true,
    incluirVerificacionCriptografica: true,
    incluirLogo: true,
  },
  formatoPersonalizado: {
    modo: 'SIMPLE',
    plantillaTexto: null,
  },
  ...overrides,
})

describe('generar-acta-apertura-pdf — VOTAR-374 UAT-01', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generates the PDF and triggers save with the expected filename', async () => {
    await generarActaAperturaPdf(buildData())

    expect(mocks.mockSave).toHaveBeenCalledWith(
      'acta-apertura-7-eleccion-utn-2026-20260901.pdf'
    )
    expect(mocks.mockText).toHaveBeenCalled()
    expect(mocks.mockAddImage).not.toHaveBeenCalled()
  })

  it('includes contract addresses and merkle root in the document body', async () => {
    const data = buildData()
    await generarActaAperturaPdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain(data.merkleRoot.hash)
    expect(renderedTexts).toContain(data.contratos.ballot.direccion)
    expect(renderedTexts).toContain(
      String(data.padron.totalVotantesHabilitados)
    )
  })

  it('embeds the institutional logo when logoUrl is present', async () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) })
    )

    await generarActaAperturaPdf(
      buildData({ logoUrl: '/uploads/sistema/logo.jpg' })
    )

    expect(mocks.mockAddImage).toHaveBeenCalledWith(
      expect.stringContaining('data:'),
      'JPEG',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('continues without a logo when the image fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await generarActaAperturaPdf(
      buildData({ logoUrl: '/uploads/sistema/logo.jpg' })
    )

    expect(mocks.mockAddImage).not.toHaveBeenCalled()
    expect(mocks.mockSave).toHaveBeenCalled()
  })

  it('omits a section when its plantilla toggle is disabled', async () => {
    const data = buildData({
      plantilla: {
        incluirDescripcion: true,
        incluirDatosApertura: true,
        incluirResumenPadron: false,
        incluirOfertaElectoral: true,
        incluirVerificacionCriptografica: true,
        incluirLogo: true,
      },
    })
    await generarActaAperturaPdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).not.toContain('Padrón electoral')
    expect(renderedTexts).not.toContain(
      String(data.padron.totalVotantesHabilitados)
    )
  })

  it('shows "Apertura automática (sistema)" when datosApertura.modo is AUTOMATICO', async () => {
    const data = buildData({
      datosApertura: {
        modo: 'AUTOMATICO',
        realizadaEn: '2026-09-01T10:00:00.000Z',
        actorNombre: null,
        actorRol: null,
      },
    })
    await generarActaAperturaPdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain('Apertura automática (sistema)')
  })

  it('renders the interpolated custom body and skips the Simple sections when modo is PERSONALIZADO', async () => {
    const data = buildData({
      formatoPersonalizado: {
        modo: 'PERSONALIZADO',
        plantillaTexto:
          'Acta de {{nombreEleccion}} — responsable: {{datosApertura.responsable}}.',
      },
    })
    await generarActaAperturaPdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain(
      'Acta de Elección UTN 2026 — responsable: Ana Gómez (ELECTION_ADMIN).'
    )
    expect(renderedTexts).not.toContain('Datos del comicio')
    expect(renderedTexts).not.toContain(
      'Oferta electoral — Candidatos postulados'
    )
  })

  it('falls back to the Simple sections when PERSONALIZADO has no plantillaTexto', async () => {
    const data = buildData({
      formatoPersonalizado: { modo: 'PERSONALIZADO', plantillaTexto: null },
    })
    await generarActaAperturaPdf(data)

    const renderedTexts = mocks.mockText.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value]
    )
    expect(renderedTexts).toContain('Datos del comicio')
  })
})
