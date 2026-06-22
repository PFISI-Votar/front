// reconstruir-csv.ts
import type { RegistroPreview } from './parse-csv-padron'

export function reconstruirCsv(registros: RegistroPreview[]): string {
  const filas = registros.map((r) => `${r.dni},${r.email}`)
  return `dni,email\n${filas.join('\n')}${filas.length > 0 ? '\n' : ''}`
}

export function construirArchivoCsv(
  registros: RegistroPreview[],
  nombre = 'padron.csv',
): File {
  return new File([reconstruirCsv(registros)], nombre, {
    type: 'text/csv;charset=utf-8;',
  })
}
