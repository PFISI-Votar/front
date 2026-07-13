import { createFileRoute } from '@tanstack/react-router'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

export const Route = createFileRoute('/verificar/')({
  component: VerificarIndexRoute,
})

function VerificarIndexRoute() {
  return <VerificadorRecibo />
}
