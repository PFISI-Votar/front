import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseArchivoPadron } from './parse-archivo-padron'

function buildExcelFile(filas: string[][], name = 'padron.xlsx'): File {
  const hoja = XLSX.utils.aoa_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Padron')
  const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' })
  return new File([buffer], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseArchivoPadron', () => {
  it('parsea Excel con columnas seleccionadas', async () => {
    const file = buildExcelFile([
      ['nombre', 'dni', 'email'],
      ['Ana', '30111222', 'ana@frvm.utn.edu.ar'],
      ['Bruno', '30222333', 'bruno@frvm.utn.edu.ar'],
    ])
    const registros = await parseArchivoPadron(file, ['dni', 'email', 'nombre'])
    expect(registros).toHaveLength(2)
    expect(registros[0]).toMatchObject({
      dni: '30111222',
      email: 'ana@frvm.utn.edu.ar',
      adicionales: { nombre: 'Ana' },
    })
  })

  it('omite filas en blanco del Excel', async () => {
    const file = buildExcelFile([
      ['dni', 'email'],
      ['30111222', 'ana@frvm.utn.edu.ar'],
      ['', ''],
      ['30222333', 'bruno@frvm.utn.edu.ar'],
    ])
    const registros = await parseArchivoPadron(file, ['dni', 'email'])
    expect(registros).toHaveLength(2)
    expect(registros[1].linea).toBe(4)
  })

  it('usa sólo la primera hoja del Excel', async () => {
    const hoja1 = XLSX.utils.aoa_to_sheet([
      ['dni', 'email'],
      ['30111222', 'ana@frvm.utn.edu.ar'],
    ])
    const hoja2 = XLSX.utils.aoa_to_sheet([
      ['dni', 'email'],
      ['30999888', 'luis@frvm.utn.edu.ar'],
    ])
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja1, 'Padron')
    XLSX.utils.book_append_sheet(libro, hoja2, 'Otra')
    const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' })
    const file = new File([buffer], 'padron.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const registros = await parseArchivoPadron(file, ['dni', 'email'])
    expect(registros).toHaveLength(1)
    expect(registros[0].dni).toBe('30111222')
  })
})
