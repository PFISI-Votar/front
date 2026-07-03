import { createFileRoute } from '@tanstack/react-router'
import { DashboardPublicoPage } from '@/features/dashboard-publico'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard')({
  component: DashboardPublicoRoute,
})

function DashboardPublicoRoute() {
  const { idEleccion } = Route.useParams()

  return <DashboardPublicoPage idEleccion={Number(idEleccion)} />
}
