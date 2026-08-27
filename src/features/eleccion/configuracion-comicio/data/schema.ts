import { z } from 'zod'
import {
  MAX_INTERVALO_SEGUNDOS,
  MAX_SUFRAGIOS_POR_VOTANTE,
  METODOS_AUTENTICACION,
} from '@/features/eleccion/configuracion-comicio/data/constants'

export const metodoAutenticacionSchema = z.enum([
  METODOS_AUTENTICACION.GOOGLE,
  METODOS_AUTENTICACION.SSO_INSTITUCIONAL,
])

export const metodosAutenticacionSchema = z
  .array(metodoAutenticacionSchema)
  .min(1, 'Seleccione al menos un método de inicio de sesión')

export type MetodoAutenticacionInput = z.infer<typeof metodoAutenticacionSchema>

export const politicaRevotoSchema = z.enum(['LAST_VOTE_WINS', 'DISABLED'])

export const guardarConfiguracionRevotoSchema = z
  .object({
    permitirVotoMultiple: z.boolean(),
    maxVotosPorVotante: z
      .number()
      .int('Ingrese un número entero')
      .min(1, 'El mínimo es 1 sufragio')
      .max(
        MAX_SUFRAGIOS_POR_VOTANTE,
        `El máximo permitido es ${MAX_SUFRAGIOS_POR_VOTANTE} sufragios`
      )
      .optional(),
    minIntervaloSegundos: z
      .number()
      .int('Ingrese un número entero de segundos')
      .min(0, 'El intervalo no puede ser negativo')
      .max(
        MAX_INTERVALO_SEGUNDOS,
        `El intervalo máximo permitido es de ${MAX_INTERVALO_SEGUNDOS / 60} minutos`
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.permitirVotoMultiple) {
      return
    }
    if ((data.maxVotosPorVotante ?? 1) < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Con re-voto habilitado se requieren al menos 2 sufragios',
        path: ['maxVotosPorVotante'],
      })
    }
  })

export type GuardarConfiguracionRevotoInput = z.infer<
  typeof guardarConfiguracionRevotoSchema
>

export type ConfiguracionRevoto = {
  idEleccion: number
  permitirVotoMultiple: boolean
  maxVotosPorVotante: number
  minIntervaloSegundos: number
  politicaRevoto: z.infer<typeof politicaRevotoSchema>
  editable: boolean
}

export const guardarConfiguracionVotoNuloSchema = z.object({
  permitirVotoNulo: z.boolean(),
})

export type GuardarConfiguracionVotoNuloInput = z.infer<
  typeof guardarConfiguracionVotoNuloSchema
>

export type ConfiguracionVotoNulo = {
  idEleccion: number
  permitirVotoNulo: boolean
  editable: boolean
}

/** VOTAR-459: visibilidad de las solapas del dashboard público mientras el comicio está en curso. */
export const guardarVisibilidadDashboardSchema = z.object({
  mostrarResultados: z.boolean(),
  mostrarParticipacion: z.boolean(),
  mostrarRevoto: z.boolean(),
  mostrarTransacciones: z.boolean(),
})

export type GuardarVisibilidadDashboardInput = z.infer<
  typeof guardarVisibilidadDashboardSchema
>

export type VisibilidadDashboard = {
  idEleccion: number
  mostrarResultados: boolean
  mostrarParticipacion: boolean
  mostrarRevoto: boolean
  mostrarTransacciones: boolean
  /** True cuando el comicio está en BORRADOR o CONFIGURADA y admite cambios. */
  editable: boolean
}
