// validar-padron.test.ts
import { describe, expect, it } from 'vitest'
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
  it('normaliza dni a dígitos y email a minúsculas', () => {
    expect(claveDedup('12.345.678', 'A@A.com')).toBe('12345678:a@a.com')
  })
})

describe('validarRegistros', () => {
  it('marca OK a un registro válido', () => {
    expect(validarRegistros([r('1', '12345678', 'a@a.com')])['1']).toBe('OK')
  })

  it('detecta DNI ausente antes que email ausente', () => {
    expect(validarRegistros([r('1', '', '')])['1']).toBe('DNI_AUSENTE')
  })

  it('detecta email ausente', () => {
    expect(validarRegistros([r('1', '12345678', '')])['1']).toBe(
      'EMAIL_AUSENTE'
    )
  })

  it('detecta DNI inválido (menos de 7 dígitos)', () => {
    expect(validarRegistros([r('1', '123', 'a@a.com')])['1']).toBe(
      'DNI_INVALIDO'
    )
  })

  it('detecta email inválido', () => {
    expect(validarRegistros([r('1', '12345678', 'no-mail')])['1']).toBe(
      'EMAIL_INVALIDO'
    )
  })

  it('marca duplicado preservando la primera aparición', () => {
    const estados = validarRegistros([
      r('1', '12345678', 'a@a.com'),
      r('2', '12.345.678', 'A@A.com'),
    ])
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
