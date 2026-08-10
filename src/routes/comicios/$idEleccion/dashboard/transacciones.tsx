import { createFileRoute } from '@tanstack/react-router'
import { TransaccionesPublicaPage } from '@/features/dashboard-publico/components/transacciones-publica-page'

export const Route = createFileRoute(
  '/comicios/$idEleccion/dashboard/transacciones'
)({
  component: DashboardPublicoTransaccionesRoute,
})

function DashboardPublicoTransaccionesRoute() {
  const { idEleccion } = Route.useParams()

  return <TransaccionesPublicaPage idEleccion={Number(idEleccion)} />
}
