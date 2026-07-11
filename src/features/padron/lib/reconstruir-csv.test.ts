import { describe, expect, it } from 'vitest'
import { parseCsvPadron, type RegistroPreview } from './parse-csv-padron'
import {
  construirArchivoCsv,
  construirCsvEjemplo,
  reconstruirCsv,
} from './reconstruir-csv'

const registros: RegistroPreview[] = [
  { id: '1', linea: 2, dni: '12345678', email: 'a@a.com', adicionales: {} },
  { id: '2', linea: 3, dni: '87654321', email: 'b@b.com', adicionales: {} },
]

describe('reconstruirCsv', () => {
  it('emite header canónico dni,email y una fila por registro', () => {
    expect(reconstruirCsv(registros)).toBe(
      'dni,email\n12345678,a@a.com\n87654321,b@b.com\n'
    )
  })

  it('descarta columnas adicionales: sólo envía dni+email al backend', () => {
    const conPii: RegistroPreview[] = [
      {
        id: '1',
        linea: 2,
        dni: '12345678',
        email: 'a@a.com',
        adicionales: {
          nombre: 'Ana',
          apellido: 'Pérez',
          direccion: 'Calle 1',
        },
      },
    ]
    const csv = reconstruirCsv(conPii)
    expect(csv).toBe('dni,email\n12345678,a@a.com\n')
    expect(csv).not.toMatch(/Ana|Pérez|Calle/)
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

describe('construirCsvEjemplo', () => {
  it('genera 5 filas con las columnas seleccionadas', () => {
    const csv = construirCsvEjemplo(['dni', 'email', 'nombre'])
    const lineas = csv.trim().split('\n')
    expect(lineas[0]).toBe('dni,email,nombre')
    expect(lineas).toHaveLength(6)
  })
})
