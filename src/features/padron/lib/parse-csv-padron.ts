// parse-csv-padron.ts
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
}

export class CsvColumnasError extends Error {
  constructor() {
    super('El archivo no tiene las columnas requeridas: dni, email.')
    this.name = 'CsvColumnasError'
  }
}

export function parseCsvPadron(texto: string): RegistroPreview[] {
  const lineas = texto.split('\n').map((l) => l.replace(/\r$/, ''))
  const cabecera = (lineas[0] ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
  const indiceDni = cabecera.indexOf('dni')
  const indiceEmail = cabecera.indexOf('email')
  if (indiceDni === -1 || indiceEmail === -1) {
    throw new CsvColumnasError()
  }

  const registros: RegistroPreview[] = []
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i]
    if (linea.trim() === '') continue
    const celdas = linea.split(',')
    registros.push({
      id: crypto.randomUUID(),
      linea: i + 1,
      dni: (celdas[indiceDni] ?? '').trim(),
      email: (celdas[indiceEmail] ?? '').trim(),
    })
  }
  return registros
}
