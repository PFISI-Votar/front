import { z } from 'zod'

export const tipoEventoAuditSchema = z.enum([
  'ACCESO_DENEGADO',
  'LOGIN',
  'CONFIG_MODIFICADA',
  'PADRON_CARGADO',
  'COMICIO_ABIERTO',
  'COMICIO_CERRADO',
  'COMICIO_ARCHIVADO',
  'VOTO_EMITIDO',
  'COMICIO_PAUSADO',
  'COMICIO_REANUDADO',
  'ACTA_CIERRE_GENERADA',
])

export type TipoEventoAudit = z.infer<typeof tipoEventoAuditSchema>

export const nivelEventoAuditSchema = z.enum(['INFO', 'ERROR'])
export type NivelEventoAudit = z.infer<typeof nivelEventoAuditSchema>

export const resultadoEventoAuditSchema = z.enum(['EXITOSO', 'RECHAZADO'])
export type ResultadoEventoAudit = z.infer<typeof resultadoEventoAuditSchema>

export const auditLogSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(50),
  idEleccion: z.number().optional(),
  tipoEvento: z.array(tipoEventoAuditSchema).optional().catch([]),
  actor: z.string().optional().catch(''),
  terminal: z.string().optional().catch(''),
  endpoint: z.string().optional().catch(''),
  desde: z.string().optional().catch(''),
  hasta: z.string().optional().catch(''),
  nivel: nivelEventoAuditSchema.optional(),
  resultado: resultadoEventoAuditSchema.optional(),
  q: z.string().optional().catch(''),
})

export type AuditLogSearchParams = z.infer<typeof auditLogSearchSchema>

export type AuditLogItem = {
  idLog: number
  idEleccion: number | null
  tipoEvento: TipoEventoAudit
  timestamp: string
  actor: string
  descripcion: string | null
  endpoint: string
  identificadorTerminal: string | null
  datosAdicionales: Record<string, unknown> | null
  hashRegistro: string | null
  hashAnterior: string | null
}

export type AuditLogListResponse = {
  items: AuditLogItem[]
  total: number
  page: number
  limit: number
}

export type AuditLogSearchFilters = {
  page: number
  limit: number
  idEleccion?: number
  tipoEvento?: TipoEventoAudit[]
  actor?: string
  terminal?: string
  endpoint?: string
  desde?: string
  hasta?: string
  nivel?: NivelEventoAudit
  resultado?: ResultadoEventoAudit
  q?: string
}
