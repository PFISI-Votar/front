import { apiClient } from '@/lib/api-client'
import type {
  AuditLogListResponse,
  AuditLogSearchFilters,
} from '@/features/audit-log/data/schema'

const buildAuditLogParams = (
  filters: AuditLogSearchFilters
): Record<string, string | number | string[]> => {
  const params: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  }

  if (filters.idEleccion != null) {
    params.idEleccion = filters.idEleccion
  }
  if (filters.tipoEvento != null && filters.tipoEvento.length > 0) {
    params.tipoEvento = filters.tipoEvento
  }
  if (filters.actor != null && filters.actor.trim().length > 0) {
    params.actor = filters.actor.trim()
  }
  if (filters.terminal != null && filters.terminal.trim().length > 0) {
    params.terminal = filters.terminal.trim()
  }
  if (filters.endpoint != null && filters.endpoint.trim().length > 0) {
    params.endpoint = filters.endpoint.trim()
  }
  if (filters.desde != null && filters.desde.length > 0) {
    params.desde = filters.desde
  }
  if (filters.hasta != null && filters.hasta.length > 0) {
    params.hasta = filters.hasta
  }
  if (filters.nivel != null) {
    params.nivel = filters.nivel
  }
  if (filters.resultado != null) {
    params.resultado = filters.resultado
  }
  if (filters.q != null && filters.q.trim().length > 0) {
    params.q = filters.q.trim()
  }

  return params
}

export const consultarAuditLog = async (
  filters: AuditLogSearchFilters
): Promise<AuditLogListResponse> => {
  const { data } = await apiClient.get<AuditLogListResponse>('/audit-log', {
    params: buildAuditLogParams(filters),
    paramsSerializer: {
      indexes: null,
    },
  })
  return data
}
