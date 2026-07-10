import { describe, expect, it } from 'vitest'
import {
  CANTIDAD_EJEMPLOS_PADRON,
  generarFilasEjemplo,
  normalizarCamposSeleccionados,
} from './campos-padron'

describe('campos-padron', () => {
  it('normalizarCamposSeleccionados siempre incluye dni y email', () => {
    expect(normalizarCamposSeleccionados(['nombre'])).toEqual([
      'dni',
      'email',
      'nombre',
    ])
  })

  it('generarFilasEjemplo produce 5 filas con las claves pedidas', () => {
    const filas = generarFilasEjemplo(['dni', 'email', 'apellido'])
    expect(filas).toHaveLength(CANTIDAD_EJEMPLOS_PADRON)
    expect(Object.keys(filas[0]).sort()).toEqual([
      'apellido',
      'dni',
      'email',
    ])
    expect(filas[0].dni).toMatch(/^\d+$/)
  })
})
