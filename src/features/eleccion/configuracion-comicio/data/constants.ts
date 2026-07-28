/** VOTAR-324: tope reglamentario de sufragios por votante (espejo de back/revoto.constants.ts). */
export const MAX_SUFRAGIOS_POR_VOTANTE = 10

/** VOTAR-325: tope reglamentario del intervalo mínimo entre re-votos, en segundos (espejo de back/revoto.constants.ts). */
export const MAX_INTERVALO_SEGUNDOS = 3600

export const METODOS_AUTENTICACION = {
  GOOGLE: 'GOOGLE',
  SSO_INSTITUCIONAL: 'SSO_INSTITUCIONAL',
} as const

export type MetodoAutenticacion =
  (typeof METODOS_AUTENTICACION)[keyof typeof METODOS_AUTENTICACION]

export const METODOS_AUTENTICACION_OPTIONS: {
  value: MetodoAutenticacion
  label: string
}[] = [
  { value: METODOS_AUTENTICACION.GOOGLE, label: 'Google' },
  {
    value: METODOS_AUTENTICACION.SSO_INSTITUCIONAL,
    label: 'SSO Institucional',
  },
]
