import { createFileRoute } from '@tanstack/react-router'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

export const Route = createFileRoute('/verificar/$txHash')({
  component: VerificarTxHashRoute,
})

function VerificarTxHashRoute() {
  const { txHash } = Route.useParams()
  return <VerificadorRecibo initialTxHash={txHash} />
}
