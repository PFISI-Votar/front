import { createFileRoute } from '@tanstack/react-router'
import { BoletaUnicaDigitalPage } from '@/features/voto'

export const Route = createFileRoute('/comicios/$idEleccion/votar')({
  component: VotarRoute,
})

function VotarRoute() {
  const { idEleccion } = Route.useParams()
  return <BoletaUnicaDigitalPage idEleccion={Number(idEleccion)} />
}
