import { createFileRoute } from '@tanstack/react-router'
import { OfertaPublicaPage } from '@/features/dashboard-publico'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard/oferta')({
  component: DashboardPublicoOfertaRoute,
})

function DashboardPublicoOfertaRoute() {
  const { idEleccion } = Route.useParams()

  return <OfertaPublicaPage idEleccion={Number(idEleccion)} />
}
