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
