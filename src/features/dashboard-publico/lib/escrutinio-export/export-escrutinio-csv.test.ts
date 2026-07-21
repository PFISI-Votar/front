import { describe, expect, it } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'
import { buildEscrutinioCsvContent } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-csv'
import { sanitizeCsvCell } from '@/features/dashboard-publico/lib/escrutinio-export/sanitize-csv-cell'

const mockEscrutinio: Escrutinio = {
  idEleccion: 3,
  nombre: 'Comicio Test',
  estado: 'CERRADA',
  congelado: true,
  fuente: 'ON_CHAIN',
  actualizadoEn: '2026-07-20T19:00:00.000Z',
  participacion: {
    totalVotos: 10,
    votosBlanco: 1,
    votosNulo: 0,
    totalVotantesHabilitados: 100,
    porcentajeParticipacion: 10,
  },
  candidatos: [
    {
      idCandidato: 1,
      nombre: 'Ana',
      apellido: '=CMD',
      idLista: 1,
      nombreLista: 'Lista A',
      siglaLista: 'LA',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 9,
      porcentaje: 90,
    },
  ],
}

describe('export-escrutinio-csv — VOTAR-369 UAT-03', () => {
  it('sanitizes CSV injection prefixes', () => {
    expect(sanitizeCsvCell('=CMD')).toBe("'=CMD")
    expect(sanitizeCsvCell('+123')).toBe("'+123")
    expect(sanitizeCsvCell('normal')).toBe('normal')
  })

  it('includes metadata and resultados sections with headers', () => {
    const document = buildEscrutinioExportDocument(mockEscrutinio, 'csv')
    const actual = buildEscrutinioCsvContent(document)
    expect(actual).toContain('clave,valor')
    expect(actual).toContain('id_eleccion,3')
    expect(actual).toContain(
      'categoria,lista,sigla_lista,candidato_apellido,candidato_nombre,votos,porcentaje'
    )
    expect(actual).toContain("'=CMD")
  })

  it('builds CSV content ready for UTF-8 BOM download', () => {
    const exportDocument = buildEscrutinioExportDocument(mockEscrutinio, 'csv')
    const actual = buildEscrutinioCsvContent(exportDocument)
    expect(actual.startsWith('clave,valor')).toBe(true)
    expect(actual.endsWith('\n')).toBe(true)
  })
})
