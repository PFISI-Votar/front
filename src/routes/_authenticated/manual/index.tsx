import { createFileRoute } from '@tanstack/react-router'
import { ManualAutoridadPage } from '@/features/manual-autoridad/components/manual-autoridad-page'

/**
 * VOTAR-395 — El padre `/_authenticated` exige sesión válida y rol
 * `election_admin`. Un votante o una sesión anónima no llega a esta página.
 */
export const Route = createFileRoute('/_authenticated/manual/')({
  component: ManualAutoridadPage,
})
