import { createFileRoute } from '@tanstack/react-router'
import { AuditLogPage } from '@/features/audit-log/components/audit-log-page'
import { auditLogSearchSchema } from '@/features/audit-log/data/schema'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/auditoria'
)({
  validateSearch: auditLogSearchSchema,
  component: ComicioAuditoriaRoute,
})

function ComicioAuditoriaRoute() {
  const search = Route.useSearch()
  const { idEleccion } = Route.useParams()
  return <AuditLogPage search={search} idEleccionFijo={Number(idEleccion)} />
}
