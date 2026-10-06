import { createFileRoute } from '@tanstack/react-router'
import { ManualAuditoresPage } from '@/features/manual-auditores'

export const Route = createFileRoute('/manual/auditores')({
  component: ManualAuditoresRoute,
})

function ManualAuditoresRoute() {
  return <ManualAuditoresPage />
}
