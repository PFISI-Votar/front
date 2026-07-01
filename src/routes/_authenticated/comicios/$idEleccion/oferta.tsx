import { createFileRoute } from '@tanstack/react-router'
import { OfertaElectoralPage } from '@/features/eleccion'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/oferta'
)({
  component: OfertaRoute,
})

function OfertaRoute() {
  const { idEleccion } = Route.useParams()
  return <OfertaElectoralPage idEleccion={Number(idEleccion)} />
}
