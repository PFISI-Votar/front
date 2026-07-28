import { z } from 'zod'
import { tipoVotacionSchema } from '@/features/eleccion/lista/data/schema'

export const candidatoEscrutinioSchema = z.object({
  idCandidato: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  idLista: z.number(),
  nombreLista: z.string(),
  siglaLista: z.string().nullable(),
  colorLista: z.string().nullable(),
  idCategoria: z.number(),
  nombreCategoria: z.string(),
  votos: z.number(),
  porcentaje: z.number(),
})

export const participacionEscrutinioSchema = z.object({
  totalVotos: z.number(),
  votosBlanco: z.number(),
  votosNulo: z.number(),
  totalVotantesHabilitados: z.number(),
  porcentajeParticipacion: z.number(),
})

export const escrutinioSchema = z.object({
  idEleccion: z.number(),
  nombre: z.string(),
  estado: z.string(),
  tipoVotacion: tipoVotacionSchema,
  congelado: z.boolean(),
  fuente: z.literal('ON_CHAIN'),
  actualizadoEn: z.string(),
  participacion: participacionEscrutinioSchema,
  candidatos: z.array(candidatoEscrutinioSchema),
})

export type CandidatoEscrutinio = z.infer<typeof candidatoEscrutinioSchema>
export type ParticipacionEscrutinio = z.infer<
  typeof participacionEscrutinioSchema
>
export type Escrutinio = z.infer<typeof escrutinioSchema>
