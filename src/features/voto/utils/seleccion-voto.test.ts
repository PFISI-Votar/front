import { describe, expect, it } from 'vitest'
import type { BoletaDigital } from '@/features/voto/data/schema'
import {
  buildConfirmarVotoInput,
  buildSeleccionesVoto,
  getCategoriasSinSeleccion,
  seleccionarCandidato,
} from '@/features/voto/utils/seleccion-voto'

const boleta = {
  idEleccion: 1,
  nombreEleccion: 'Comicio UTN',
  estadoEleccion: 'ABIERTA',
  idBoleta: 10,
  titulo: 'Boleta',
  permitirVotoEnBlanco: false,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      descripcion: null,
      orden: 1,
      estado: 'DISPONIBLE',
      candidatos: [{ idCandidato: 10 }],
    },
    {
      idCategoria: 2,
      nombre: 'Vocales',
      descripcion: null,
      orden: 2,
      estado: 'DISPONIBLE',
      candidatos: [{ idCandidato: 20 }],
    },
  ],
} as BoletaDigital

describe('seleccion-voto', () => {
  it('reemplaza la selección previa sólo dentro de la misma categoría', () => {
    const base = seleccionarCandidato({}, 1, 10)
    const conOtraCategoria = seleccionarCandidato(base, 2, 20)
    const actual = seleccionarCandidato(conOtraCategoria, 1, 11)

    expect(actual).toEqual({ 1: 11, 2: 20 })
  })

  it('genera payload ordenado por categoría', () => {
    expect(buildSeleccionesVoto({ 2: 20, 1: 10 })).toEqual([
      { idCategoria: 1, idCandidato: 10 },
      { idCategoria: 2, idCandidato: 20 },
    ])
  })

  it('arma el input de confirmación con idempotencyKey estable', () => {
    expect(buildConfirmarVotoInput({ 1: 10 }, 'key')).toEqual({
      idempotencyKey: 'key',
      selecciones: [{ idCategoria: 1, idCandidato: 10 }],
    })
  })

  it('detecta categorías pendientes de selección', () => {
    expect(getCategoriasSinSeleccion(boleta, { 1: 10 })).toHaveLength(1)
  })
})
