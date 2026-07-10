import {
  generarFilasEjemplo,
  normalizarCamposSeleccionados,
  type CampoPadronDefinicion,
  type ClaveCampoPadron,
} from './campos-padron'
import type { RegistroPreview } from './parse-csv-padron'

/** Reconstruye CSV canónico sólo con dni+email (lo que consume el backend). */
export function reconstruirCsv(registros: RegistroPreview[]): string {
  const filas = registros.map((r) => `${r.dni},${r.email}`)
  return `dni,email\n${filas.join('\n')}${filas.length > 0 ? '\n' : ''}`
}

export function construirArchivoCsv(
  registros: RegistroPreview[],
  nombre = 'padron.csv'
): File {
  return new File([reconstruirCsv(registros)], nombre, {
    type: 'text/csv;charset=utf-8;',
  })
}

/** CSV de ejemplo con las columnas seleccionadas y 5 filas ilustrativas. */
export function construirCsvEjemplo(
  campos: ClaveCampoPadron[],
  definiciones?: CampoPadronDefinicion[]
): string {
  const ordenados = normalizarCamposSeleccionados(campos, definiciones)
  const filas = generarFilasEjemplo(ordenados, definiciones)
  const lineas = [
    ordenados.join(','),
    ...filas.map((fila) => ordenados.map((c) => fila[c] ?? '').join(',')),
  ]
  return `${lineas.join('\n')}\n`
}

export function descargarCsvEjemplo(
  campos: ClaveCampoPadron[],
  definiciones?: CampoPadronDefinicion[]
): void {
  const contenido = construirCsvEjemplo(campos, definiciones)
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'padron-ejemplo.csv'
  enlace.click()
  URL.revokeObjectURL(url)
}
