import { createFileRoute } from '@tanstack/react-router'
import { AuditLogPage } from '@/features/audit-log/components/audit-log-page'
import { auditLogSearchSchema } from '@/features/audit-log/data/schema'

export const Route = createFileRoute('/_authenticated/auditoria/')({
  validateSearch: auditLogSearchSchema,
  component: AuditoriaGlobalRoute,
})

function AuditoriaGlobalRoute() {
  const search = Route.useSearch()
  return <AuditLogPage search={search} />
}
