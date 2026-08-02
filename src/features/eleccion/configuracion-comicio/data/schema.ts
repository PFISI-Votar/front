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
      .int()
      .min(1)
      .max(MAX_SUFRAGIOS_POR_VOTANTE)
      .optional(),
    minIntervaloSegundos: z
      .number()
      .int()
      .min(0)
      .max(MAX_INTERVALO_SEGUNDOS)
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
