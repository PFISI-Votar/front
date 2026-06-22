// reconstruir-csv.test.ts
import { describe, expect, it } from 'vitest'
import { construirArchivoCsv, reconstruirCsv } from './reconstruir-csv'
import { parseCsvPadron, type RegistroPreview } from './parse-csv-padron'

const registros: RegistroPreview[] = [
  { id: '1', linea: 2, dni: '12345678', email: 'a@a.com' },
  { id: '2', linea: 3, dni: '87654321', email: 'b@b.com' },
]

describe('reconstruirCsv', () => {
  it('emite header canónico dni,email y una fila por registro', () => {
    expect(reconstruirCsv(registros)).toBe(
      'dni,email\n12345678,a@a.com\n87654321,b@b.com\n',
    )
  })

  it('round-trip: parse -> reconstruct -> parse conserva dni/email', () => {
    const reparsado = parseCsvPadron(reconstruirCsv(registros))
    expect(reparsado.map((r) => [r.dni, r.email])).toEqual([
      ['12345678', 'a@a.com'],
      ['87654321', 'b@b.com'],
    ])
  })
})

describe('construirArchivoCsv', () => {
  it('crea un File .csv con el contenido reconstruido', async () => {
    const file = construirArchivoCsv(registros)
    expect(file.name).toBe('padron.csv')
    expect(file.type).toContain('csv')
    expect(await file.text()).toBe(reconstruirCsv(registros))
  })
})
