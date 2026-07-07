import { describe, expect, it } from 'vitest'
import {
  PERSON_NAME_PATTERN,
  sanitizePersonNameInput,
} from '@/lib/person-name'

describe('sanitizePersonNameInput', () => {
  it('elimina símbolos especiales al escribir', () => {
    expect(sanitizePersonNameInput('Juan & Pedro')).toBe('Juan Pedro')
    expect(sanitizePersonNameInput('Ana@123')).toBe('Ana')
    expect(sanitizePersonNameInput('María <script>')).toBe('María script')
  })

  it('conserva letras acentuadas, espacios, guiones y apóstrofes', () => {
    expect(sanitizePersonNameInput("O'Brien")).toBe("O'Brien")
    expect(sanitizePersonNameInput('García-López')).toBe('García-López')
    expect(sanitizePersonNameInput('María del Carmen')).toBe('María del Carmen')
  })
})

describe('PERSON_NAME_PATTERN', () => {
  it('acepta nombres válidos', () => {
    expect(PERSON_NAME_PATTERN.test('Ana')).toBe(true)
    expect(PERSON_NAME_PATTERN.test('María del Carmen')).toBe(true)
    expect(PERSON_NAME_PATTERN.test("O'Brien")).toBe(true)
    expect(PERSON_NAME_PATTERN.test('García-López')).toBe(true)
  })

  it('rechaza caracteres especiales y dígitos', () => {
    expect(PERSON_NAME_PATTERN.test('Juan & Pedro')).toBe(false)
    expect(PERSON_NAME_PATTERN.test('Ana2')).toBe(false)
    expect(PERSON_NAME_PATTERN.test('@Pedro')).toBe(false)
    expect(PERSON_NAME_PATTERN.test('---')).toBe(false)
  })
})
