import { afterEach, describe, expect, it } from 'vitest'
import { CAMPOS_PADRON_PREDEFINIDOS } from './campos-padron'
import type { RegistroPreview } from './parse-csv-padron'
import {
  clavePreview,
  guardarPreview,
  leerPreview,
  limpiarPreview,
} from './preview-storage'

const reg: RegistroPreview[] = [
  { id: 'a', linea: 2, dni: '12345678', email: 'a@a.com', adicionales: {} },
]

afterEach(() => sessionStorage.clear())

describe('preview-storage', () => {
  it('clavePreview namespaces por idEleccion', () => {
    expect(clavePreview(7)).toBe('padron-preview:7')
  })

  it('guarda y lee los registros con campos y definiciones', () => {
    guardarPreview(7, reg, ['dni', 'email', 'nombre'])
    expect(leerPreview(7)).toEqual({
      campos: ['dni', 'email', 'nombre'],
      definiciones: CAMPOS_PADRON_PREDEFINIDOS,
      registros: reg,
    })
  })

  it('leerPreview devuelve null si no hay nada', () => {
    expect(leerPreview(99)).toBeNull()
  })

  it('leerPreview devuelve null ante JSON corrupto', () => {
    sessionStorage.setItem(clavePreview(7), '{no-json')
    expect(leerPreview(7)).toBeNull()
  })

  it('compat: lee el formato legacy (array plano)', () => {
    sessionStorage.setItem(
      clavePreview(7),
      JSON.stringify([{ id: 'a', linea: 2, dni: '1', email: 'a@a.com' }])
    )
    expect(leerPreview(7)).toEqual({
      campos: ['dni', 'email'],
      definiciones: CAMPOS_PADRON_PREDEFINIDOS,
      registros: [
        { id: 'a', linea: 2, dni: '1', email: 'a@a.com', adicionales: {} },
      ],
    })
  })

  it('limpiarPreview borra la entrada', () => {
    guardarPreview(7, reg)
    limpiarPreview(7)
    expect(leerPreview(7)).toBeNull()
  })

  it('no cruza datos entre elecciones', () => {
    guardarPreview(7, reg)
    expect(leerPreview(8)).toBeNull()
  })
})
