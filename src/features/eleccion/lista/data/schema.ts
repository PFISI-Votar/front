import { z } from 'zod'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import type { EleccionEstado } from '@/features/eleccion/data/schema'

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
