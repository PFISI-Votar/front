import { describe, expect, it } from 'vitest'
import type { BoletaDigital } from '@/features/voto/data/schema'
import {
  buildSeleccionesVoto,
  getCategoriasSinCandidatos,
  getCategoriasSinSeleccion,
  seleccionarCandidato,
} from '@/features/voto/utils/seleccion-voto'

const boleta: BoletaDigital = {
  idEleccion: 1,
  nombreEleccion: 'Test',
  estadoEleccion: 'ABIERTA',
  idBoleta: 1,
  titulo: 'Boleta',
  permitirVotoEnBlanco: true,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      descripcion: null,
      orden: 1,
      estado: 'DISPONIBLE',
      candidatos: [
        {
          idCandidato: 10,
          idCategoria: 1,
          idLista: 1,
          listId: 1,
          nombre: 'Ana',
          apellido: 'A',
          nombreCompleto: 'Ana A',
          agrupacionPolitica: 'L1',
          numeroLista: 1,
          fotoUrl: null,
        },
      ],
    },
    {
      idCategoria: 2,
      nombre: 'Vacia',
      descripcion: null,
      orden: 2,
      estado: 'SIN_CANDIDATOS',
      candidatos: [],
    },
  ],
}

describe('seleccion-voto', () => {
  it('selecciona un candidato por categoría', () => {
    expect(seleccionarCandidato({}, 1, 10)).toEqual({ 1: 10 })
  })

  it('arma selecciones ordenadas', () => {
    expect(buildSeleccionesVoto({ 2: 20, 1: 10 })).toEqual([
      { idCategoria: 1, idCandidato: 10 },
      { idCategoria: 2, idCandidato: 20 },
    ])
  })

  it('detecta categorías sin selección y sin candidatos', () => {
    expect(
      getCategoriasSinSeleccion(boleta, {}).map((c) => c.idCategoria)
    ).toEqual([1])
    expect(
      getCategoriasSinCandidatos(boleta).map((c) => c.idCategoria)
    ).toEqual([2])
  })
})
