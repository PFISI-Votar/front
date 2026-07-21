import { describe, expect, it } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'

const mockEscrutinio: Escrutinio = {
  idEleccion: 7,
  nombre: 'Elección CEUTI 2026',
  estado: 'CERRADA',
  congelado: true,
  fuente: 'ON_CHAIN',
  actualizadoEn: '2026-07-20T19:00:00.000Z',
  participacion: {
    totalVotos: 100,
    votosBlanco: 5,
    votosNulo: 2,
    totalVotantesHabilitados: 500,
    porcentajeParticipacion: 20,
  },
  candidatos: [
    {
      idCandidato: 2,
      nombre: 'Juan',
      apellido: 'López',
      idLista: 2,
      nombreLista: 'Lista B',
      siglaLista: 'LB',
      colorLista: '#ff0000',
      idCategoria: 2,
      nombreCategoria: 'Vocal',
      votos: 40,
      porcentaje: 40,
    },
    {
      idCandidato: 1,
      nombre: 'Ana',
      apellido: 'Pérez',
      idLista: 1,
      nombreLista: 'Lista A',
      siglaLista: 'LA',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 53,
      porcentaje: 53,
    },
  ],
}

describe('buildEscrutinioExportDocument — VOTAR-369', () => {
  it('validates input and builds metadata with version 1.0', () => {
    const actual = buildEscrutinioExportDocument(
      mockEscrutinio,
      'json',
      '2026-07-21T12:00:00.000Z'
    )
    expect(actual.metadata.idEleccion).toBe(7)
    expect(actual.metadata.nombre).toBe('Elección CEUTI 2026')
    expect(actual.metadata.estado).toBe('CERRADA')
    expect(actual.metadata.formato).toBe('json')
    expect(actual.metadata.version).toBe('1.0')
    expect(actual.metadata.exportadoEn).toBe('2026-07-21T12:00:00.000Z')
  })

  it('groups candidatos by categoria in stable order', () => {
    const actual = buildEscrutinioExportDocument(mockEscrutinio, 'csv')
    expect(actual.resumenPorCategoria).toHaveLength(2)
    expect(actual.resumenPorCategoria[0]?.idCategoria).toBe(1)
    expect(actual.resumenPorCategoria[0]?.totalVotosCategoria).toBe(53)
    expect(actual.resumenPorCategoria[1]?.idCategoria).toBe(2)
    expect(actual.resumenPorCategoria[1]?.candidatos).toHaveLength(1)
  })

  it('rejects invalid escrutinio payload', () => {
    expect(() =>
      buildEscrutinioExportDocument(
        { ...mockEscrutinio, fuente: 'OFF_CHAIN' as 'ON_CHAIN' },
        'json'
      )
    ).toThrow()
  })
})
