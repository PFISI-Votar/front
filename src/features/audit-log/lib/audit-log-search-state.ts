import type {
  AuditLogSearchParams,
  NivelEventoAudit,
  ResultadoEventoAudit,
  TipoEventoAudit,
} from '@/features/audit-log/data/schema'

export type AuditLogToolbarDraft = {
  tipoEvento: TipoEventoAudit[]
  actor: string
  terminal: string
  endpoint: string
  desde: string
  hasta: string
  nivel: NivelEventoAudit | ''
  resultado: ResultadoEventoAudit | ''
  q: string
  idEleccion: string
}

export const searchParamsToDraft = (
  search: AuditLogSearchParams,
  idEleccionFijo?: number
): AuditLogToolbarDraft => ({
  tipoEvento: search.tipoEvento ?? [],
  actor: search.actor ?? '',
  terminal: search.terminal ?? '',
  endpoint: search.endpoint ?? '',
  desde: search.desde ?? '',
  hasta: search.hasta ?? '',
  nivel: search.nivel ?? '',
  resultado: search.resultado ?? '',
  q: search.q ?? '',
  idEleccion:
    idEleccionFijo != null
      ? String(idEleccionFijo)
      : search.idEleccion != null
        ? String(search.idEleccion)
        : '',
})

export const draftToSearchParams = (
  draft: AuditLogToolbarDraft,
  page: number,
  pageSize: number,
  idEleccionFijo?: number
): AuditLogSearchParams => ({
  page,
  pageSize,
  idEleccion:
    idEleccionFijo ??
    (draft.idEleccion.length > 0 ? Number(draft.idEleccion) : undefined),
  tipoEvento: draft.tipoEvento.length > 0 ? draft.tipoEvento : undefined,
  actor: draft.actor.trim().length > 0 ? draft.actor.trim() : undefined,
  terminal:
    draft.terminal.trim().length > 0 ? draft.terminal.trim() : undefined,
  endpoint:
    draft.endpoint.trim().length > 0 ? draft.endpoint.trim() : undefined,
  desde: draft.desde.length > 0 ? draft.desde : undefined,
  hasta: draft.hasta.length > 0 ? draft.hasta : undefined,
  nivel: draft.nivel || undefined,
  resultado: draft.resultado || undefined,
  q: draft.q.trim().length > 0 ? draft.q.trim() : undefined,
})

export const emptyDraft = (idEleccionFijo?: number): AuditLogToolbarDraft => ({
  tipoEvento: [],
  actor: '',
  terminal: '',
  endpoint: '',
  desde: '',
  hasta: '',
  nivel: '',
  resultado: '',
  q: '',
  idEleccion: idEleccionFijo != null ? String(idEleccionFijo) : '',
})
