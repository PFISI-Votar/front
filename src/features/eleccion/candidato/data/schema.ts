import { z } from 'zod'

export type TipoCampoCandidato =
  | 'texto'
  | 'numero'
  | 'email'
  | 'url'
  | 'fecha'
  | 'booleano'

export type ValidacionCampoCandidato = {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
}

export type CampoCandidatoDefinicion = {
  clave: string
  etiqueta: string
  tipo: TipoCampoCandidato
  obligatorio: boolean
  ejemplo?: string
  ayuda?: string
  orden: number
  validacion?: ValidacionCampoCandidato
}

export type ConfiguracionDatosCandidatoResponse = {
  idEleccion: number
  campos: CampoCandidatoDefinicion[]
  editable: boolean
  cantidadCandidatos: number
}

export const campoCandidatoDefinicionSchema = z.object({
  clave: z
    .string()
    .min(1, 'La clave es obligatoria')
    .max(50)
    .regex(/^[a-z][a-z0-9_-]*$/, 'Use minúsculas, números y guiones (ej. legajo-utn)'),
  etiqueta: z.string().min(1, 'La etiqueta es obligatoria').max(100),
  tipo: z.enum(['texto', 'numero', 'email', 'url', 'fecha', 'booleano']),
  obligatorio: z.boolean(),
  ejemplo: z.string().max(255).optional(),
  ayuda: z.string().max(500).optional(),
  orden: z.number().int().min(1),
  validacion: z
    .object({
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().max(500).optional(),
      patternMessage: z.string().max(255).optional(),
    })
    .optional(),
})

export const guardarConfiguracionSchema = z.object({
  campos: z.array(campoCandidatoDefinicionSchema),
})

export const createCandidatoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  idCategoria: z.number().int().min(1, 'Seleccione un rol de candidato'),
  orden: z.number().int().min(1).optional(),
  fotoFile: z.custom<File>().optional().nullable(),
  removeFoto: z.boolean().optional(),
  datosAdicionales: z.record(z.string(), z.unknown()),
})

export type GuardarConfiguracionInput = z.infer<typeof guardarConfiguracionSchema>
export type CreateCandidatoInput = z.infer<typeof createCandidatoSchema>

export type Candidato = {
  idCandidato: number
  idLista: number
  idCategoria: number
  categoriaNombre?: string
  nombre: string
  apellido: string
  orden: number
  fotoUrl: string | null
  datosAdicionales: Record<string, unknown>
}

export type CampoCandidatoError = {
  clave: string
  message: string
}
