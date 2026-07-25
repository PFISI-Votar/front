import { describe, expect, it } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  formatRelativeUpdate,
  toBarChartData,
  toDonutChartData,
} from '@/features/dashboard-publico/lib/escrutinio-chart-data'

const sample: Escrutinio = {
  idEleccion: 1,
  nombre: 'Test',
  estado: 'ABIERTA',
  tipoVotacion: 'POR_LISTA',
  congelado: false,
  fuente: 'ON_CHAIN',
  actualizadoEn: new Date().toISOString(),
  participacion: {
    totalVotos: 10,
    votosBlanco: 2,
    votosNulo: 1,
    totalVotantesHabilitados: 100,
    porcentajeParticipacion: 10,
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
      votos: 7,
      porcentaje: 70,
    },
  ],
}

describe('escrutinio-chart-data — VOTAR-364', () => {
  it('maps candidatos to bar chart series', () => {
    const actual = toBarChartData(sample)
    expect(actual).toEqual([
      {
        idCandidato: 1,
        name: 'Pérez, Ana (LA)',
        votos: 7,
        fill: '#2f6f9f',
      },
    ])
  })

  it('includes blanco and nulo in donut series', () => {
    const actual = toDonutChartData(sample)
    expect(actual).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pérez, Ana (LA)', value: 7 }),
        expect.objectContaining({ name: 'En blanco', value: 2 }),
        expect.objectContaining({ name: 'Nulos', value: 1 }),
      ])
    )
  })

  it('formats relative update timestamps', () => {
    const now = Date.parse('2026-07-20T12:00:00.000Z')
    expect(formatRelativeUpdate('2026-07-20T11:59:55.000Z', now)).toBe(
      'hace 5s'
    )
    expect(formatRelativeUpdate('2026-07-20T11:59:58.000Z', now)).toBe(
      'justo ahora'
    )
  })
})
