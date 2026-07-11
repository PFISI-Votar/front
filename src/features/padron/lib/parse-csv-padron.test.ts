import { describe, expect, it } from 'vitest'
import { CsvColumnasError, parseCsvPadron } from './parse-csv-padron'

describe('parseCsvPadron', () => {
  it('parsea filas con header dni,email', () => {
    const r = parseCsvPadron('dni,email\n12345678,a@a.com\n87654321,b@b.com\n')
    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({
      linea: 2,
      dni: '12345678',
      email: 'a@a.com',
      adicionales: {},
    })
    expect(r[1]).toMatchObject({ linea: 3, dni: '87654321', email: 'b@b.com' })
    expect(typeof r[0].id).toBe('string')
    expect(r[0].id).not.toBe(r[1].id)
  })

  it('respeta el orden de columnas del header', () => {
    const r = parseCsvPadron('email,dni\nx@x.com,12345678\n')
    expect(r[0]).toMatchObject({ dni: '12345678', email: 'x@x.com' })
  })

  it('parsea columnas opcionales seleccionadas', () => {
    const r = parseCsvPadron(
      'dni,nombre,email,apellido\n12345678,Ana,a@a.com,Pérez\n',
      ['dni', 'email', 'nombre', 'apellido']
    )
    expect(r[0]).toMatchObject({
      dni: '12345678',
      email: 'a@a.com',
      adicionales: { nombre: 'Ana', apellido: 'Pérez' },
    })
  })

  it('ignora columnas extra no seleccionadas', () => {
    const r = parseCsvPadron('dni,nombre,email\n12345678,Ana,a@a.com\n', [
      'dni',
      'email',
    ])
    expect(r[0].adicionales).toEqual({})
  })

  it('ignora líneas en blanco y numera por línea física', () => {
    const r = parseCsvPadron(
      'dni,email\n12345678,a@a.com\n\n87654321,b@b.com\n'
    )
    expect(r).toHaveLength(2)
    expect(r[1].linea).toBe(4)
  })

  it('tolera CRLF', () => {
    const r = parseCsvPadron('dni,email\r\n12345678,a@a.com\r\n')
    expect(r[0].email).toBe('a@a.com')
  })

  it('preserva celdas vacías para que la validación las marque', () => {
    const r = parseCsvPadron('dni,email\n,a@a.com\n')
    expect(r[0]).toMatchObject({ dni: '', email: 'a@a.com' })
  })

  it('lanza CsvColumnasError si falta una columna seleccionada', () => {
    expect(() => parseCsvPadron('dni\n12345678\n', ['dni', 'email'])).toThrow(
      CsvColumnasError
    )
  })

  it('incluye dni y email aunque no se pasen en la selección', () => {
    const r = parseCsvPadron('dni,email,nombre\n12345678,a@a.com,Ana\n', [
      'nombre',
    ])
    expect(r[0]).toMatchObject({
      dni: '12345678',
      email: 'a@a.com',
      adicionales: { nombre: 'Ana' },
    })
  })

  it('lanza CsvColumnasError si falta una columna opcional seleccionada', () => {
    expect(() =>
      parseCsvPadron('dni,email\n12345678,a@a.com\n', [
        'dni',
        'email',
        'nombre',
      ])
    ).toThrow(/nombre/)
  })

  it('parsea campos entrecomillados con comas internas', () => {
    const r = parseCsvPadron(
      'dni,nombre,email,direccion\n12345678,"Pérez, Ana",a@a.com,"San Martín 123, 4B"\n',
      ['dni', 'email', 'nombre', 'direccion']
    )
    expect(r[0]).toMatchObject({
      dni: '12345678',
      email: 'a@a.com',
      adicionales: {
        nombre: 'Pérez, Ana',
        direccion: 'San Martín 123, 4B',
      },
    })
  })

  it('soporta comillas escapadas "" dentro del campo', () => {
    const r = parseCsvPadron(
      'dni,email,direccion\n12345678,a@a.com,"Calle ""Principal"" 1"\n',
      ['dni', 'email', 'direccion']
    )
    expect(r[0].adicionales.direccion).toBe('Calle "Principal" 1')
  })
})
