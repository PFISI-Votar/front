import * as XLSX from 'xlsx'
import type { ClaveCampoPadron } from './campos-padron'
import {
  ArchivoPadronError,
  CsvColumnasError,
  parseCsvPadron,
  parseFilasPadron,
  type RegistroPreview,
} from './parse-csv-padron'

export function esArchivoPadronSoportado(file: File): boolean {
  const nombre = file.name.toLowerCase()
  return (
    nombre.endsWith('.csv') ||
    nombre.endsWith('.xlsx') ||
    nombre.endsWith('.xls')
  )
}

export function esExcel(file: File): boolean {
  const nombre = file.name.toLowerCase()
  return nombre.endsWith('.xlsx') || nombre.endsWith('.xls')
}

/**
 * Lee CSV o Excel y valida que contenga las columnas seleccionadas.
 * Columnas extra en el archivo se ignoran.
 * En Excel sólo se procesa la primera hoja del libro.
 */
export async function parseArchivoPadron(
  file: File,
  camposEsperados: ClaveCampoPadron[]
): Promise<RegistroPreview[]> {
  if (esExcel(file)) {
    return parseExcelPadron(file, camposEsperados)
  }
  const texto = await file.text()
  return parseCsvPadron(texto, camposEsperados)
}

async function parseExcelPadron(
  file: File,
  camposEsperados: ClaveCampoPadron[]
): Promise<RegistroPreview[]> {
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    throw new ArchivoPadronError(
      'No se pudo leer el archivo Excel. Verifique que el formato sea .xlsx o .xls.'
    )
  }

  // Sólo la primera hoja del libro.
  const nombreHoja = workbook.SheetNames[0]
  if (!nombreHoja) {
    throw new CsvColumnasError(['dni', 'email'])
  }

  const hoja = workbook.Sheets[nombreHoja]
  const matriz = XLSX.utils.sheet_to_json<string[]>(hoja, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: true,
  })

  if (matriz.length === 0) {
    throw new CsvColumnasError(['dni', 'email'])
  }

  const cabecera = (matriz[0] ?? []).map((c) => String(c ?? ''))
  const filas = matriz.slice(1).map((fila, idx) => {
    const celdas = (Array.isArray(fila) ? fila : []).map((c) => String(c ?? ''))
    const vacia = celdas.every((c) => c.trim() === '')
    return {
      linea: idx + 2,
      celdas: vacia ? null : celdas,
    }
  })

  return parseFilasPadron(cabecera, filas, camposEsperados)
}
