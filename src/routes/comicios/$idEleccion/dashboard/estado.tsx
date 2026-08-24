import { createFileRoute } from '@tanstack/react-router'
import { EstadoContratoPublicaPage } from '@/features/dashboard-publico/components/estado-contrato-publica-page'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard/estado')({
  component: DashboardPublicoEstadoRoute,
})

function DashboardPublicoEstadoRoute() {
  const { idEleccion } = Route.useParams()

  return <EstadoContratoPublicaPage idEleccion={Number(idEleccion)} />
}
