import { slugifyEtiquetaToClave } from '@/features/eleccion/candidato/utils/slugify-etiqueta-clave'

/** Clave de columna del padrón (predefinida o personalizada). */
export type ClaveCampoPadron = string

export interface CampoPadronDefinicion {
  clave: ClaveCampoPadron
  etiqueta: string
  /** Si true, arranca marcado en el selector. */
  preseleccionado: boolean
  /**
   * Si true, no se puede desmarcar: forma parte del hash de identidad
   * (dni+email, alineado con Autogestión / VotanteAuthService).
   */
  obligatorio: boolean
  /** Valor de ejemplo para la guía visual (5 filas). */
  ejemplos: string[]
  personalizado?: boolean
}

export const CANTIDAD_EJEMPLOS_PADRON = 5

export const CAMPOS_PADRON_PREDEFINIDOS: CampoPadronDefinicion[] = [
  {
    clave: 'dni',
    etiqueta: 'DNI',
    preseleccionado: true,
    obligatorio: true,
    ejemplos: ['30111222', '28999888', '31555666', '27444333', '32888777'],
  },
  {
    clave: 'email',
    etiqueta: 'Email',
    preseleccionado: true,
    obligatorio: true,
    ejemplos: [
      'ana.perez@frvm.utn.edu.ar',
      'bruno.gomez@frvm.utn.edu.ar',
      'carla.diaz@frvm.utn.edu.ar',
      'diego.lopez@frvm.utn.edu.ar',
      'elena.ruiz@frvm.utn.edu.ar',
    ],
  },
  {
    clave: 'nombre',
    etiqueta: 'Nombre',
    preseleccionado: false,
    obligatorio: false,
    ejemplos: ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena'],
  },
  {
    clave: 'apellido',
    etiqueta: 'Apellido',
    preseleccionado: false,
    obligatorio: false,
    ejemplos: ['Pérez', 'Gómez', 'Díaz', 'López', 'Ruiz'],
  },
  {
    clave: 'direccion',
    etiqueta: 'Dirección',
    preseleccionado: false,
    obligatorio: false,
    ejemplos: [
      'San Martín 123',
      'Belgrano 456',
      'Rivadavia 789',
      'Mitre 321',
      'Sarmiento 654',
    ],
  },
]

/** @deprecated usar CAMPOS_PADRON_PREDEFINIDOS */
export const CAMPOS_PADRON = CAMPOS_PADRON_PREDEFINIDOS

export const CLAVES_IDENTIDAD = ['dni', 'email'] as const

export function clavesObligatorias(): ClaveCampoPadron[] {
  return CAMPOS_PADRON_PREDEFINIDOS.filter((c) => c.obligatorio).map(
    (c) => c.clave
  )
}

export function camposPreseleccionados(): ClaveCampoPadron[] {
  return CAMPOS_PADRON_PREDEFINIDOS.filter((c) => c.preseleccionado).map(
    (c) => c.clave
  )
}

export function esCampoObligatorio(clave: ClaveCampoPadron): boolean {
  return (CLAVES_IDENTIDAD as readonly string[]).includes(clave)
}

export function normalizarCamposSeleccionados(
  seleccion: ClaveCampoPadron[],
  definiciones: CampoPadronDefinicion[] = CAMPOS_PADRON_PREDEFINIDOS
): ClaveCampoPadron[] {
  const set = new Set<ClaveCampoPadron>([
    ...clavesObligatorias(),
    ...seleccion.map((c) => c.trim().toLowerCase()).filter(Boolean),
  ])
  const ordenDefs = definiciones.map((d) => d.clave)
  const ordenados = ordenDefs.filter((clave) => set.has(clave))
  for (const clave of set) {
    if (!ordenados.includes(clave)) ordenados.push(clave)
  }
  return ordenados
}

export function crearCampoPersonalizado(
  etiqueta: string,
  existentes: CampoPadronDefinicion[]
): CampoPadronDefinicion | null {
  const etiquetaLimpia = etiqueta.trim()
  if (!etiquetaLimpia) return null

  let clave = slugifyEtiquetaToClave(etiquetaLimpia)
  if (!clave) return null

  const usadas = new Set(existentes.map((c) => c.clave))
  if (usadas.has(clave)) {
    let i = 2
    while (usadas.has(`${clave}-${i}`)) i++
    clave = `${clave}-${i}`
  }

  return {
    clave,
    etiqueta: etiquetaLimpia,
    preseleccionado: true,
    obligatorio: false,
    personalizado: true,
    ejemplos: Array.from(
      { length: CANTIDAD_EJEMPLOS_PADRON },
      (_, i) => `${etiquetaLimpia} ${i + 1}`
    ),
  }
}

/** Genera 5 filas de ejemplo según los campos seleccionados. */
export function generarFilasEjemplo(
  campos: ClaveCampoPadron[],
  definiciones: CampoPadronDefinicion[] = CAMPOS_PADRON_PREDEFINIDOS
): Record<string, string>[] {
  const ordenados = normalizarCamposSeleccionados(campos, definiciones)
  const porClave = new Map(definiciones.map((d) => [d.clave, d]))
  const filas: Record<string, string>[] = []
  for (let i = 0; i < CANTIDAD_EJEMPLOS_PADRON; i++) {
    const fila: Record<string, string> = {}
    for (const clave of ordenados) {
      const def = porClave.get(clave)
      fila[clave] = def?.ejemplos[i] ?? `${clave}-${i + 1}`
    }
    filas.push(fila)
  }
  return filas
}

export function etiquetaCampo(
  clave: ClaveCampoPadron,
  definiciones: CampoPadronDefinicion[] = CAMPOS_PADRON_PREDEFINIDOS
): string {
  return definiciones.find((c) => c.clave === clave)?.etiqueta ?? clave
}

/** Ancho del modal según cantidad de columnas seleccionadas. */
export function claseAnchoModalPadron(cantidadCampos: number): string {
  if (cantidadCampos <= 2) return 'sm:max-w-2xl'
  if (cantidadCampos <= 4) return 'sm:max-w-3xl'
  if (cantidadCampos <= 6) return 'sm:max-w-4xl'
  return 'sm:max-w-5xl'
}
