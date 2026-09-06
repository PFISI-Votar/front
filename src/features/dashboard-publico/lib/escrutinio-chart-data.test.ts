import { describe, expect, it } from 'vitest'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  barChartTitleFor,
  buildGanadores,
  formatRelativeUpdate,
  toBarChartData,
  toDonutChartData,
  toDonutChartDataByCategoria,
} from '@/features/dashboard-publico/lib/escrutinio-chart-data'

const sampleLista: Escrutinio = {
  idEleccion: 1,
  nombre: 'Test lista',
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
    {
      idCandidato: 2,
      nombre: 'Bruno',
      apellido: 'Gómez',
      idLista: 1,
      nombreLista: 'Lista A',
      siglaLista: 'LA',
      colorLista: '#2f6f9f',
      idCategoria: 2,
      nombreCategoria: 'Vice',
      votos: 7,
      porcentaje: 70,
    },
    {
      idCandidato: 3,
      nombre: 'Carla',
      apellido: 'Ruiz',
      idLista: 2,
      nombreLista: 'Lista B',
      siglaLista: 'LB',
      colorLista: '#c45c26',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 1,
      porcentaje: 10,
    },
  ],
}

const sampleCargo: Escrutinio = {
  ...sampleLista,
  nombre: 'Test cargo',
  tipoVotacion: 'POR_CANDIDATO',
}

describe('escrutinio-chart-data — VOTAR-364 / VOTAR-464', () => {
  it('POR_LISTA: aggregates bars by lista (max votos within list)', () => {
    const actual = toBarChartData(sampleLista)
    expect(actual).toEqual([
      {
        id: 'lista-1',
        name: 'Lista A (LA)',
        votos: 7,
        fill: '#2f6f9f',
      },
      {
        id: 'lista-2',
        name: 'Lista B (LB)',
        votos: 1,
        fill: '#c45c26',
      },
    ])
    expect(barChartTitleFor('POR_LISTA')).toBe('Votos por lista')
  })

  it('POR_CANDIDATO: keeps one bar per candidato', () => {
    const actual = toBarChartData(sampleCargo)
    expect(actual).toHaveLength(3)
    expect(actual[0]).toMatchObject({
      id: 'candidato-1',
      name: 'Pérez, Ana (LA)',
      votos: 7,
    })
    expect(barChartTitleFor('POR_CANDIDATO')).toBe('Votos por candidato')
  })

  it('POR_LISTA: donut uses lista tallies plus blanco/nulo', () => {
    const actual = toDonutChartData(sampleLista)
    expect(actual).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'LA', value: 7 }),
        expect.objectContaining({ name: 'LB', value: 1 }),
        expect.objectContaining({ name: 'En blanco', value: 2 }),
        expect.objectContaining({ name: 'Nulos', value: 1 }),
      ])
    )
  })

  it('VOTAR-447: omits nulos from donut when permitirVotoNulo is false', () => {
    const actual = toDonutChartData(sampleLista, { permitirVotoNulo: false })
    expect(actual).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'En blanco', value: 2 }),
      ])
    )
    expect(actual.find((d) => d.name === 'Nulos')).toBeUndefined()
  })

  it('POR_CANDIDATO: builds one donut series per categoría', () => {
    const actual = toDonutChartDataByCategoria(sampleCargo)
    expect(actual).toHaveLength(2)
    expect(actual[0]).toMatchObject({
      nombreCategoria: 'Presidente',
    })
    expect(actual[0]?.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pérez, Ana (LA)', value: 7 }),
        expect.objectContaining({ name: 'Ruiz, Carla (LB)', value: 1 }),
      ])
    )
    expect(actual[1]).toMatchObject({
      nombreCategoria: 'Vice',
    })
    expect(actual[1]?.data).toEqual([
      expect.objectContaining({ name: 'Gómez, Bruno (LA)', value: 7 }),
    ])
  })

  it('buildGanadores ranks lists for POR_LISTA', () => {
    const grupos = buildGanadores(sampleLista)
    expect(grupos).toHaveLength(1)
    expect(grupos[0]?.titulo).toBe('Por lista')
    expect(grupos[0]?.entradas[0]).toMatchObject({
      puesto: 1,
      label: 'Lista A (LA)',
      votos: 7,
    })
    expect(grupos[0]?.entradas[1]).toMatchObject({
      puesto: 2,
      label: 'Lista B (LB)',
      votos: 1,
    })
  })

  it('buildGanadores ranks candidatos per categoría for POR_CANDIDATO', () => {
    const grupos = buildGanadores(sampleCargo)
    expect(grupos.map((g) => g.titulo)).toEqual(['Presidente', 'Vice'])
    expect(grupos[0]?.entradas[0]).toMatchObject({
      puesto: 1,
      label: 'Pérez, Ana',
      sublabel: 'LA',
      votos: 7,
    })
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
