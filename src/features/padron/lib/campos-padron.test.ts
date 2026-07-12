import { describe, expect, it } from 'vitest'
import {
  CANTIDAD_EJEMPLOS_PADRON,
  CAMPOS_PADRON_PREDEFINIDOS,
  camposPreseleccionados,
  claseAnchoModalPadron,
  crearCampoPersonalizado,
  generarFilasEjemplo,
  normalizarCamposSeleccionados,
} from './campos-padron'

describe('campos-padron', () => {
  it('camposPreseleccionados arranca con dni y email', () => {
    expect(camposPreseleccionados()).toEqual(['dni', 'email'])
  })

  it('normalizarCamposSeleccionados siempre incluye dni y email', () => {
    expect(normalizarCamposSeleccionados(['nombre'])).toEqual([
      'dni',
      'email',
      'nombre',
    ])
  })

  it('normalizarCamposSeleccionados preserva orden de definiciones', () => {
    expect(normalizarCamposSeleccionados(['apellido', 'dni', 'email'])).toEqual(
      ['dni', 'email', 'apellido']
    )
  })

  it('generarFilasEjemplo produce 5 filas con las claves pedidas', () => {
    const filas = generarFilasEjemplo(['dni', 'email', 'apellido'])
    expect(filas).toHaveLength(CANTIDAD_EJEMPLOS_PADRON)
    expect(Object.keys(filas[0]).sort()).toEqual(['apellido', 'dni', 'email'])
    expect(filas[0].dni).toMatch(/^\d+$/)
  })

  it('crearCampoPersonalizado genera clave slug y ejemplos', () => {
    const campo = crearCampoPersonalizado(
      'Legajo UTN',
      CAMPOS_PADRON_PREDEFINIDOS
    )
    expect(campo).toMatchObject({
      clave: 'legajo-utn',
      etiqueta: 'Legajo UTN',
      personalizado: true,
    })
    expect(campo?.ejemplos).toHaveLength(CANTIDAD_EJEMPLOS_PADRON)
  })

  it('crearCampoPersonalizado evita colisiones de clave', () => {
    const base = [
      ...CAMPOS_PADRON_PREDEFINIDOS,
      {
        clave: 'legajo',
        etiqueta: 'Legajo',
        preseleccionado: true,
        obligatorio: false,
        personalizado: true,
        ejemplos: [],
      },
    ]
    const campo = crearCampoPersonalizado('Legajo', base)
    expect(campo?.clave).toBe('legajo-2')
  })

  it('claseAnchoModalPadron crece con la cantidad de columnas', () => {
    expect(claseAnchoModalPadron(2)).toContain('2xl')
    expect(claseAnchoModalPadron(5)).toContain('4xl')
    expect(claseAnchoModalPadron(8)).toContain('5xl')
  })
})
