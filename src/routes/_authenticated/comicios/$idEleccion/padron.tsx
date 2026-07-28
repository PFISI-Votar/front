import { createFileRoute } from '@tanstack/react-router'
import { PadronComicioPage } from '@/features/padron/components/padron-comicio-page'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/padron'
)({
  component: PadronRoute,
})

function PadronRoute() {
  const { idEleccion } = Route.useParams()
  return <PadronComicioPage idEleccion={Number(idEleccion)} />
}
