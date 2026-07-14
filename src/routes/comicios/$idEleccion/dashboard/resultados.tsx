import { createFileRoute } from '@tanstack/react-router'
import { DashboardPublicoPage } from '@/features/dashboard-publico'

export const Route = createFileRoute(
  '/comicios/$idEleccion/dashboard/resultados'
)({
  component: DashboardPublicoResultadosRoute,
})

function DashboardPublicoResultadosRoute() {
  const { idEleccion } = Route.useParams()

  return (
    <DashboardPublicoPage
      idEleccion={Number(idEleccion)}
      section='resultados'
    />
  )
}
