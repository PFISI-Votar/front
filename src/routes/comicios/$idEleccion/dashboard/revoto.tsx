import { createFileRoute } from '@tanstack/react-router'
import { RevotoPublicaPage } from '@/features/dashboard-publico/components/revoto-publica-page'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard/revoto')({
  component: DashboardPublicoRevotoRoute,
})

function DashboardPublicoRevotoRoute() {
  const { idEleccion } = Route.useParams()

  return <RevotoPublicaPage idEleccion={Number(idEleccion)} />
}
