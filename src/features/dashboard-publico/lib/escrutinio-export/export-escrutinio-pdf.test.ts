import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'
import { exportEscrutinioPdf } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-pdf'

const mocks = vi.hoisted(() => {
  const mockSave = vi.fn()
  const mockText = vi.fn()
  const mockSetFontSize = vi.fn()
  const mockSetFont = vi.fn()
  const mockSetLineWidth = vi.fn()
  const mockLine = vi.fn()
  const mockSplitTextToSize = vi.fn((text: string) => [text])
  const mockSetTextColor = vi.fn()
  const mockAddPage = vi.fn()
  const mockSetDrawColor = vi.fn()
  return {
    mockSave,
    mockText,
    mockSetFontSize,
    mockSetFont,
    mockSetLineWidth,
    mockLine,
    mockSplitTextToSize,
    mockSetTextColor,
    mockAddPage,
    mockSetDrawColor,
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

const mockEscrutinio: Escrutinio = {
  idEleccion: 9,
  nombre: 'Elección Final',
  estado: 'CERRADA',
  congelado: true,
  fuente: 'ON_CHAIN',
  actualizadoEn: '2026-07-20T19:00:00.000Z',
  participacion: {
    totalVotos: 50,
    votosBlanco: 3,
    votosNulo: 1,
    totalVotantesHabilitados: 300,
    porcentajeParticipacion: 16.7,
  },
  candidatos: [
    {
      idCandidato: 1,
      nombre: 'Pedro',
      apellido: 'Ruiz',
      idLista: 1,
      nombreLista: 'Lista A',
      siglaLista: 'LA',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 46,
      porcentaje: 92,
    },
  ],
}

describe('export-escrutinio-pdf — VOTAR-369 UAT-02', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates PDF and triggers save with expected filename', async () => {
    const document = buildEscrutinioExportDocument(
      mockEscrutinio,
      'pdf',
      '2026-07-21T12:00:00.000Z'
    )
    await exportEscrutinioPdf(document)
    expect(mocks.mockSave).toHaveBeenCalledWith(
      'escrutinio-9-eleccion-final-20260721.pdf'
    )
    expect(mocks.mockText).toHaveBeenCalled()
  })
})
