import { createFileRoute } from '@tanstack/react-router'
import { DashboardPublicoPage } from '@/features/dashboard-publico'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard/')({
  component: DashboardPublicoIndexRoute,
})

function DashboardPublicoIndexRoute() {
  const { idEleccion } = Route.useParams()

  return (
    <DashboardPublicoPage idEleccion={Number(idEleccion)} section='resumen' />
  )
}
