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

export const createListaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(255),
  sigla: z.string().min(1, 'La sigla es obligatoria').max(20),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido (ej. #2563eb)')
    .optional()
    .or(z.literal('')),
})

export const createCandidatoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  idCategoria: z.number().int().min(1, 'Seleccione una categoría'),
  cargo: z.string().max(100).optional(),
  orden: z.number().int().min(1).optional(),
  datosAdicionales: z.record(z.string(), z.unknown()),
})

export const createComicioSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
    fechaFin: z.string().min(1, 'Fecha de cierre requerida'),
  })
  .superRefine((data, ctx) => {
    const inicio = new Date(data.fechaInicio)
    const fin = new Date(data.fechaFin)
    if (fin <= inicio) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de cierre debe ser posterior a la de inicio',
        path: ['fechaFin'],
      })
    }
  })

export type GuardarConfiguracionInput = z.infer<typeof guardarConfiguracionSchema>
export type CreateListaInput = z.infer<typeof createListaSchema>
export type CreateCandidatoInput = z.infer<typeof createCandidatoSchema>
export type CreateComicioInput = z.infer<typeof createComicioSchema>

export type EleccionEstado =
  | 'BORRADOR'
  | 'CONFIGURADA'
  | 'ABIERTA'
  | 'CERRADA'
  | 'ESCRUTADA'

export type Eleccion = {
  idEleccion: number
  nombre: string
  descripcion?: string | null
  fechaInicio: string
  fechaFin: string
  estado: EleccionEstado
}

export type Candidato = {
  idCandidato: number
  idLista: number
  idCategoria: number
  nombre: string
  apellido: string
  cargo: string | null
  orden: number
  fotoUrl: string | null
  datosAdicionales: Record<string, unknown>
}

export type Lista = {
  idLista: number
  idBoleta: number
  nombre: string
  sigla: string
  color: string | null
  estado: string
  listId: number | null
  fechaOficializacion: string | null
  idCategoriaDefault?: number
  candidatos?: Candidato[]
}

export type ListaMapeoItem = {
  idLista: number
  listId: number
  nombre: string
  sigla: string
}

export type OficializarResponse = {
  idEleccion: number
  estado: EleccionEstado
  mapeo: ListaMapeoItem[]
}

export type CampoCandidatoError = {
  clave: string
  message: string
}
