import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { consultarAuditLog } from '@/features/audit-log/api/audit-log-api'
import type { AuditLogSearchFilters } from '@/features/audit-log/data/schema'

export const useAuditLogSearch = (
  filters: AuditLogSearchFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => consultarAuditLog(filters),
    enabled,
    placeholderData: keepPreviousData,
  })
}
