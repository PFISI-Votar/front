import { z } from 'zod'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import type { EleccionEstado, RolCandidato } from '@/features/eleccion/data/schema'

export type { RolCandidato }

export const TIPOS_VOTACION = {
  POR_CANDIDATO: 'POR_CANDIDATO',
  POR_LISTA: 'POR_LISTA',
  MIXTO: 'MIXTO',
} as const

export type TipoVotacion = (typeof TIPOS_VOTACION)[keyof typeof TIPOS_VOTACION]

export const tipoVotacionSchema = z.enum([
  TIPOS_VOTACION.POR_CANDIDATO,
  TIPOS_VOTACION.POR_LISTA,
  TIPOS_VOTACION.MIXTO,
])

export const rolCandidatoSchema = z.object({
  idCategoria: z.number().int().min(1).optional(),
  nombre: z.string().min(1, 'El nombre del rol es obligatorio').max(255),
  maximoPostulantes: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'El máximo de postulantes debe ser al menos 1'),
})

export const rolesCandidatoSchema = z
  .array(rolCandidatoSchema)
  .min(1, 'Defina al menos un rol de candidato')

export type RolCandidatoInput = z.infer<typeof rolCandidatoSchema>

export const TIPO_VOTACION_OPTIONS: { value: TipoVotacion; label: string }[] = [
  { value: TIPOS_VOTACION.POR_CANDIDATO, label: 'Por candidato (cargo)' },
  { value: TIPOS_VOTACION.POR_LISTA, label: 'Por lista' },
  { value: TIPOS_VOTACION.MIXTO, label: 'Mixto (lista y candidato)' },
]

export const createListaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(255),
  sigla: z.string().min(1, 'La sigla es obligatoria').max(20),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido (ej. #2563eb)')
    .optional()
    .or(z.literal('')),
})

export type CreateListaInput = z.infer<typeof createListaSchema>

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
  roles?: RolCandidato[]
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
