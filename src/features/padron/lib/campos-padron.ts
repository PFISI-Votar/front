/** Campos disponibles para el archivo de padrón (VOTAR-417). */
export type ClaveCampoPadron =
  | 'dni'
  | 'email'
  | 'nombre'
  | 'apellido'
  | 'direccion'

export interface CampoPadronDefinicion {
  clave: ClaveCampoPadron
  etiqueta: string
  /** dni y email son identidad del hash; siempre obligatorios. */
  obligatorio: boolean
  /** Valor de ejemplo para la guía visual (5 filas). */
  ejemplos: string[]
}

export const CAMPOS_PADRON: CampoPadronDefinicion[] = [
  {
    clave: 'dni',
    etiqueta: 'DNI',
    obligatorio: true,
    ejemplos: ['30111222', '28999888', '31555666', '27444333', '32888777'],
  },
  {
    clave: 'email',
    etiqueta: 'Email',
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
    obligatorio: false,
    ejemplos: ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena'],
  },
  {
    clave: 'apellido',
    etiqueta: 'Apellido',
    obligatorio: false,
    ejemplos: ['Pérez', 'Gómez', 'Díaz', 'López', 'Ruiz'],
  },
  {
    clave: 'direccion',
    etiqueta: 'Dirección',
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

export const CLAVES_IDENTIDAD: ClaveCampoPadron[] = ['dni', 'email']

export const CANTIDAD_EJEMPLOS_PADRON = 5

export function clavesObligatorias(): ClaveCampoPadron[] {
  return CAMPOS_PADRON.filter((c) => c.obligatorio).map((c) => c.clave)
}

export function normalizarCamposSeleccionados(
  seleccion: ClaveCampoPadron[]
): ClaveCampoPadron[] {
  const set = new Set<ClaveCampoPadron>([...clavesObligatorias(), ...seleccion])
  return CAMPOS_PADRON.map((c) => c.clave).filter((clave) => set.has(clave))
}

/** Genera 5 filas de ejemplo según los campos seleccionados. */
export function generarFilasEjemplo(
  campos: ClaveCampoPadron[]
): Record<ClaveCampoPadron, string>[] {
  const ordenados = normalizarCamposSeleccionados(campos)
  const filas: Record<ClaveCampoPadron, string>[] = []
  for (let i = 0; i < CANTIDAD_EJEMPLOS_PADRON; i++) {
    const fila = {} as Record<ClaveCampoPadron, string>
    for (const clave of ordenados) {
      const def = CAMPOS_PADRON.find((c) => c.clave === clave)!
      fila[clave] = def.ejemplos[i] ?? ''
    }
    filas.push(fila)
  }
  return filas
}

export function etiquetaCampo(clave: ClaveCampoPadron): string {
  return CAMPOS_PADRON.find((c) => c.clave === clave)?.etiqueta ?? clave
}
