import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BoletaUnicaDigitalPage } from '@/features/voto'

export const Route = createFileRoute('/comicios/$idEleccion/votar')({
  component: VotarRoute,
})

function VotarRoute() {
  const { idEleccion } = Route.useParams()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'VOTAR - Boleta Única Digital'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return <BoletaUnicaDigitalPage idEleccion={Number(idEleccion)} />
}
