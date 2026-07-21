import { createFileRoute } from '@tanstack/react-router'
import { ParticipacionPublicaPage } from '@/features/dashboard-publico/components/participacion-publica-page'

export const Route = createFileRoute(
  '/comicios/$idEleccion/dashboard/participacion'
)({
  component: DashboardPublicoParticipacionRoute,
})

function DashboardPublicoParticipacionRoute() {
  const { idEleccion } = Route.useParams()

  return <ParticipacionPublicaPage idEleccion={Number(idEleccion)} />
}
