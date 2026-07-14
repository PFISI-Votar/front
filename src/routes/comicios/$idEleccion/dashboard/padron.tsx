import { createFileRoute } from '@tanstack/react-router'
import { DashboardPublicoPage } from '@/features/dashboard-publico'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard/padron')({
  component: DashboardPublicoPadronRoute,
})

function DashboardPublicoPadronRoute() {
  const { idEleccion } = Route.useParams()

  return <DashboardPublicoPage idEleccion={Number(idEleccion)} section='padron' />
}
