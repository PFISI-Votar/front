import { createFileRoute } from '@tanstack/react-router'
import { ManualVotantePage } from '@/features/manual-votante'

export const Route = createFileRoute('/manual/votante')({
  component: ManualVotanteRoute,
})

function ManualVotanteRoute() {
  return <ManualVotantePage />
}
