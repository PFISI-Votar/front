import { describe, expect, it } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'
import {
  calcularBaseVotosValidos,
  calcularPorcentajeVotos,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-calculos'
import { buildEscrutinioJsonPayload } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-json'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const mockEscrutinioPorLista: Escrutinio = {
  idEleccion: 7,
  nombre: 'Elección CEUTI 2026',
  estado: 'CERRADA',
  tipoVotacion: TIPOS_VOTACION.POR_LISTA,
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
      porcentaje: 41,
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
      porcentaje: 54.1,
    },
  ],
}

const mockEscrutinioPorCandidato: Escrutinio = {
  ...mockEscrutinioPorLista,
  tipoVotacion: TIPOS_VOTACION.POR_CANDIDATO,
}

describe('buildEscrutinioExportDocument — VOTAR-369', () => {
  it('validates input and builds metadata with version 1.0', () => {
    const actual = buildEscrutinioExportDocument(
      mockEscrutinioPorLista,
      'json',
      '2026-07-21T12:00:00.000Z'
    )
    expect(actual.metadata.idEleccion).toBe(7)
    expect(actual.metadata.nombre).toBe('Elección CEUTI 2026')
    expect(actual.metadata.estado).toBe('CERRADA')
    expect(actual.metadata.tipoVotacion).toBe(TIPOS_VOTACION.POR_LISTA)
    expect(actual.metadata.formato).toBe('json')
    expect(actual.metadata.version).toBe('1.0')
    expect(actual.metadata.exportadoEn).toBe('2026-07-21T12:00:00.000Z')
  })

  it('groups results by lista when tipoVotacion is POR_LISTA', () => {
    const actual = buildEscrutinioExportDocument(mockEscrutinioPorLista, 'json')
    expect(actual.resultados.tipoVotacion).toBe(TIPOS_VOTACION.POR_LISTA)
    if (actual.resultados.tipoVotacion !== TIPOS_VOTACION.POR_LISTA) {
      throw new Error('Expected POR_LISTA results')
    }
    expect(actual.resultados.resumenPorLista).toHaveLength(2)
    expect(actual.resultados.resumenPorLista[0]?.nombreLista).toBe('Lista A')
    expect(actual.resultados.resumenPorLista[0]?.totalVotosLista).toBe(53)
    expect(actual.resultados.votoEnBlanco).toEqual({
      votos: 5,
      porcentaje: 5.1,
    })
  })

  it('groups results by categoria when tipoVotacion is POR_CANDIDATO', () => {
    const actual = buildEscrutinioExportDocument(
      mockEscrutinioPorCandidato,
      'csv'
    )
    expect(actual.resultados.tipoVotacion).toBe(TIPOS_VOTACION.POR_CANDIDATO)
    if (actual.resultados.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
      throw new Error('Expected category results')
    }
    expect(actual.resultados.resumenPorCategoria).toHaveLength(2)
    expect(actual.resultados.resumenPorCategoria[0]?.idCategoria).toBe(1)
    expect(actual.resultados.resumenPorCategoria[0]?.totalVotosCategoria).toBe(
      53
    )
  })

  it('calculates blank and partisan percentages excluding null votes', () => {
    const escrutinio: Escrutinio = {
      idEleccion: 1,
      nombre: 'Comicio 3 votantes',
      estado: 'CERRADA',
      tipoVotacion: TIPOS_VOTACION.POR_LISTA,
      congelado: true,
      fuente: 'ON_CHAIN',
      actualizadoEn: '2026-07-20T19:00:00.000Z',
      participacion: {
        totalVotos: 3,
        votosBlanco: 1,
        votosNulo: 1,
        totalVotantesHabilitados: 3,
        porcentajeParticipacion: 100,
      },
      candidatos: [
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
          votos: 1,
          porcentaje: 50,
        },
      ],
    }
    const actual = buildEscrutinioExportDocument(escrutinio, 'json')
    expect(calcularBaseVotosValidos(escrutinio.participacion)).toBe(2)
    expect(calcularPorcentajeVotos(1, 2)).toBe(50)
    if (actual.resultados.tipoVotacion !== TIPOS_VOTACION.POR_LISTA) {
      throw new Error('Expected POR_LISTA results')
    }
    expect(actual.resultados.resumenPorLista[0]).toMatchObject({
      totalVotosLista: 1,
      porcentaje: 50,
    })
    expect(actual.resultados.votoEnBlanco).toEqual({
      votos: 1,
      porcentaje: 50,
    })
    const jsonPayload = buildEscrutinioJsonPayload(actual)
    expect(jsonPayload).not.toHaveProperty('resumenPorCategoria')
    expect(jsonPayload.resultados).toMatchObject({
      tipoVotacion: TIPOS_VOTACION.POR_LISTA,
    })
  })

  it('rejects invalid escrutinio payload', () => {
    expect(() =>
      buildEscrutinioExportDocument(
        { ...mockEscrutinioPorLista, fuente: 'OFF_CHAIN' as 'ON_CHAIN' },
        'json'
      )
    ).toThrow()
  })
})
