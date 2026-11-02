// validar-padron.test.ts
import { describe, expect, it } from 'vitest'
import { CriterioHashPadron } from './campos-padron'
import type { RegistroPreview } from './parse-csv-padron'
import { claveDedup, contarProblemas, validarRegistros } from './validar-padron'

const r = (id: string, dni: string, email: string): RegistroPreview => ({
  id,
  linea: 0,
  dni,
  email,
  adicionales: {},
})

describe('claveDedup', () => {
  it('normaliza segun criterio DNI', () => {
    expect(claveDedup('12.345.678', 'A@A.com', CriterioHashPadron.DNI)).toBe(
      '12345678'
    )
  })

  it('normaliza segun criterio EMAIL', () => {
    expect(claveDedup('12.345.678', 'A@A.com', CriterioHashPadron.EMAIL)).toBe(
      'a@a.com'
    )
  })

  it('normaliza segun criterio DNI_Y_EMAIL', () => {
    expect(
      claveDedup('12.345.678', 'A@A.com', CriterioHashPadron.DNI_Y_EMAIL)
    ).toBe('12345678:a@a.com')
  })
})

describe('validarRegistros', () => {
  it('marca OK a un registro válido con criterio DNI', () => {
    expect(
      validarRegistros([r('1', '12345678', 'a@a.com')], CriterioHashPadron.DNI)[
        '1'
      ]
    ).toBe('OK')
    // Email vacío es tolerado si el criterio es solo DNI
    expect(
      validarRegistros([r('2', '12345678', '')], CriterioHashPadron.DNI)['2']
    ).toBe('OK')
  })

  it('detecta DNI ausente con criterio DNI', () => {
    expect(
      validarRegistros([r('1', '', '')], CriterioHashPadron.DNI)['1']
    ).toBe('DNI_AUSENTE')
  })

  it('detecta email ausente con criterio DNI_Y_EMAIL', () => {
    expect(
      validarRegistros(
        [r('1', '12345678', '')],
        CriterioHashPadron.DNI_Y_EMAIL
      )['1']
    ).toBe('EMAIL_AUSENTE')
  })

  it('detecta email ausente con criterio EMAIL', () => {
    expect(
      validarRegistros([r('1', '', '')], CriterioHashPadron.EMAIL)['1']
    ).toBe('EMAIL_AUSENTE')
  })

  it('detecta DNI inválido (menos de 7 dígitos)', () => {
    expect(
      validarRegistros([r('1', '123', 'a@a.com')], CriterioHashPadron.DNI)['1']
    ).toBe('DNI_INVALIDO')
  })

  it('detecta email inválido', () => {
    expect(
      validarRegistros([r('1', '12345678', 'no-mail')], CriterioHashPadron.DNI)[
        '1'
      ]
    ).toBe('EMAIL_INVALIDO')
  })

  it('marca duplicado preservando la primera aparición (criterio DNI)', () => {
    const estados = validarRegistros(
      [r('1', '12345678', 'a@a.com'), r('2', '12.345.678', 'otro@a.com')],
      CriterioHashPadron.DNI
    )
    expect(estados['1']).toBe('OK')
    expect(estados['2']).toBe('DUPLICADO')
  })

  it('marca duplicado preservando la primera aparición (criterio EMAIL)', () => {
    const estados = validarRegistros(
      [r('1', '11111111', 'a@a.com'), r('2', '22222222', 'A@A.com')],
      CriterioHashPadron.EMAIL
    )
    expect(estados['1']).toBe('OK')
    expect(estados['2']).toBe('DUPLICADO')
  })
})

describe('contarProblemas', () => {
  it('cuenta los registros con estado distinto de OK', () => {
    expect(
      contarProblemas({ '1': 'OK', '2': 'DUPLICADO', '3': 'DNI_INVALIDO' })
    ).toBe(2)
  })
})
