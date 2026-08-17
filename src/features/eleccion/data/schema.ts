import { z } from 'zod'
import { isUtcIsoDateTime } from '@/lib/datetime'
import type { MetodoAutenticacion } from '@/features/eleccion/configuracion-comicio/data/constants'
import { metodosAutenticacionSchema } from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  tipoVotacionSchema,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'

export type EleccionEstado =
  'BORRADOR' | 'CONFIGURADA' | 'ABIERTA' | 'CERRADA' | 'ESCRUTADA' | 'ARCHIVADA'

export type RolCandidato = {
  idCategoria: number
  nombre: string
  minimoPostulantes: number
  maximoPostulantes: number
  orden: number
}

export type Eleccion = {
  idEleccion: number
  nombre: string
  descripcion?: string | null
  fechaInicio: string
  fechaFin: string
  estado: EleccionEstado
  /** VOTAR-347: eje ortogonal a `estado` — puede estar ABIERTA y pausada a la vez. */
  pausada: boolean
  pausadaEn?: string | null
  tipoVotacion: TipoVotacion
  roles: RolCandidato[]
  metodosAutenticacion: MetodoAutenticacion[]
}

/** VOTAR-347 */
export type SolicitudPausaTipo = 'PAUSAR' | 'REANUDAR'

export type EstadoSolicitudPausa = {
  tipo: SolicitudPausaTipo
  confirmaciones: number
  requeridas: number
  ejecutada: boolean
  razon?: string | null
  txHashBallot?: string | null
  txHashVoteRegistry?: string | null
} | null

const utcIsoDateTimeSchema = z
  .string()
  .min(1, 'Fecha requerida')
  .refine(isUtcIsoDateTime, {
    message: 'Fecha y hora inválidas',
  })

export const createComicioSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    fechaInicio: utcIsoDateTimeSchema,
    fechaFin: utcIsoDateTimeSchema,
    tipoVotacion: tipoVotacionSchema,
    metodosAutenticacion: metodosAutenticacionSchema,
  })
  .superRefine((data, ctx) => {
    const ahora = new Date()
    const inicio = new Date(data.fechaInicio)
    const fin = new Date(data.fechaFin)

    if (!Number.isNaN(inicio.getTime()) && inicio <= ahora) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de apertura debe ser posterior al momento actual',
        path: ['fechaInicio'],
      })
    }

    if (!Number.isNaN(fin.getTime()) && fin <= ahora) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de cierre debe ser posterior al momento actual',
        path: ['fechaFin'],
      })
    }

    if (
      !Number.isNaN(inicio.getTime()) &&
      !Number.isNaN(fin.getTime()) &&
      fin <= inicio
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de cierre debe ser posterior a la de inicio',
        path: ['fechaFin'],
      })
    }
  })

export type CreateComicioInput = z.infer<typeof createComicioSchema>
