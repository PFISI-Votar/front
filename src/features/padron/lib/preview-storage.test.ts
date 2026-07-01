// preview-storage.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import type { RegistroPreview } from './parse-csv-padron'
import {
  clavePreview,
  guardarPreview,
  leerPreview,
  limpiarPreview,
} from './preview-storage'

const reg: RegistroPreview[] = [
  { id: 'a', linea: 2, dni: '12345678', email: 'a@a.com' },
]

afterEach(() => sessionStorage.clear())

describe('preview-storage', () => {
  it('clavePreview namespaces por idEleccion', () => {
    expect(clavePreview(7)).toBe('padron-preview:7')
  })

  it('guarda y lee los registros', () => {
    guardarPreview(7, reg)
    expect(leerPreview(7)).toEqual(reg)
  })

  it('leerPreview devuelve null si no hay nada', () => {
    expect(leerPreview(99)).toBeNull()
  })

  it('leerPreview devuelve null ante JSON corrupto', () => {
    sessionStorage.setItem(clavePreview(7), '{no-json')
    expect(leerPreview(7)).toBeNull()
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
