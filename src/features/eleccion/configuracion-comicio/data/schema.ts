import { z } from 'zod'
import { METODOS_AUTENTICACION } from '@/features/eleccion/configuracion-comicio/data/constants'

export const metodoAutenticacionSchema = z.enum([
  METODOS_AUTENTICACION.GOOGLE,
  METODOS_AUTENTICACION.SSO_INSTITUCIONAL,
])

export const metodosAutenticacionSchema = z
  .array(metodoAutenticacionSchema)
  .min(1, 'Seleccione al menos un método de inicio de sesión')

export type MetodoAutenticacionInput = z.infer<typeof metodoAutenticacionSchema>

export const politicaRevotoSchema = z.enum(['LAST_VOTE_WINS', 'DISABLED'])

export const guardarConfiguracionRevotoSchema = z.object({
  permitirVotoMultiple: z.boolean(),
  maxVotosPorVotante: z.number().int().min(1).max(1).optional(),
})

export type GuardarConfiguracionRevotoInput = z.infer<
  typeof guardarConfiguracionRevotoSchema
>

export type ConfiguracionRevoto = {
  idEleccion: number
  permitirVotoMultiple: boolean
  maxVotosPorVotante: number
  politicaRevoto: z.infer<typeof politicaRevotoSchema>
  editable: boolean
}
