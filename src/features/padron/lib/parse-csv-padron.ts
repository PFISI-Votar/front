import {
  normalizarCamposSeleccionados,
  type ClaveCampoPadron,
} from './campos-padron'

export type TipoNovedadPreview =
  | 'OK'
  | 'DNI_AUSENTE'
  | 'EMAIL_AUSENTE'
  | 'DNI_INVALIDO'
  | 'EMAIL_INVALIDO'
  | 'DUPLICADO'

export interface RegistroPreview {
  id: string
  linea: number
  dni: string
  email: string
  /** Columnas de visualización (predefinidas o personalizadas). */
  adicionales: Record<string, string>
}

export class ArchivoPadronError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchivoPadronError'
  }
}

export class CsvColumnasError extends Error {
  constructor(columnasFaltantes: string[]) {
    super(
      `El archivo no tiene las columnas requeridas: ${columnasFaltantes.join(', ')}.`
    )
    this.name = 'CsvColumnasError'
  }
}

/**
 * Parsea una línea CSV RFC-4180 (comillas, comas dentro de campos, "" escapado).
 * No soporta campos multilínea.
 */
export function parseCsvLinea(linea: string): string[] {
  const celdas: string[] = []
  let actual = ''
  let enComillas = false
  for (let i = 0; i < linea.length; i++) {
    const char = linea[i]
    if (enComillas) {
      if (char === '"') {
        if (linea[i + 1] === '"') {
          actual += '"'
          i++
        } else {
          enComillas = false
        }
      } else {
        actual += char
      }
      continue
    }
    if (char === '"') {
      enComillas = true
      continue
    }
    if (char === ',') {
      celdas.push(actual)
      actual = ''
      continue
    }
    actual += char
  }
  celdas.push(actual)
  return celdas
}

export function parseCsvPadron(
  texto: string,
  camposEsperados: ClaveCampoPadron[] = ['dni', 'email']
): RegistroPreview[] {
  const lineas = texto
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
  const cabecera = parseCsvLinea(lineas[0] ?? '').map((c) =>
    c.trim().toLowerCase()
  )
  return parseFilasDesdeCabecera(
    cabecera,
    lineas.slice(1).map((linea, idx) => ({
      linea: idx + 2,
      celdas: linea.trim() === '' ? null : parseCsvLinea(linea),
    })),
    camposEsperados
  )
}

export function parseFilasPadron(
  cabeceraCruda: string[],
  filas: Array<{ linea: number; celdas: string[] | null }>,
  camposEsperados: ClaveCampoPadron[] = ['dni', 'email']
): RegistroPreview[] {
  const cabecera = cabeceraCruda.map((c) => c.trim().toLowerCase())
  return parseFilasDesdeCabecera(cabecera, filas, camposEsperados)
}

function parseFilasDesdeCabecera(
  cabecera: string[],
  filas: Array<{ linea: number; celdas: string[] | null }>,
  camposEsperados: ClaveCampoPadron[]
): RegistroPreview[] {
  const campos = normalizarCamposSeleccionados(camposEsperados)
  if (campos.length === 0) {
    throw new CsvColumnasError(['(ningún campo seleccionado)'])
  }

  const indices = new Map<ClaveCampoPadron, number>()
  const faltantes: string[] = []

  for (const clave of campos) {
    const idx = cabecera.indexOf(clave)
    if (idx === -1) {
      faltantes.push(clave)
    } else {
      indices.set(clave, idx)
    }
  }
  if (faltantes.length > 0) {
    throw new CsvColumnasError(faltantes)
  }

  const registros: RegistroPreview[] = []
  for (const fila of filas) {
    if (fila.celdas === null) continue
    const celdas = fila.celdas
    const dni = indices.has('dni')
      ? (celdas[indices.get('dni')!] ?? '').trim()
      : ''
    const email = indices.has('email')
      ? (celdas[indices.get('email')!] ?? '').trim()
      : ''
    const adicionales: RegistroPreview['adicionales'] = {}
    for (const clave of campos) {
      if (clave === 'dni' || clave === 'email') continue
      adicionales[clave] = (celdas[indices.get(clave)!] ?? '').trim()
    }
    registros.push({
      id: crypto.randomUUID(),
      linea: fila.linea,
      dni,
      email,
      adicionales,
    })
  }
  return registros
}
