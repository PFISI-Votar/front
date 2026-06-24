import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import {
  ensureValidAccessToken,
  probeAdminAccessDenied,
} from '@/features/auth/services/auth-session'
import { ELECTION_ADMIN_ROLE } from '@/features/auth/types/auth.types'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const hasValidSession = await ensureValidAccessToken()
    if (!hasValidSession) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    const user = useAuthStore.getState().auth.user
    if (!user || user.role !== ELECTION_ADMIN_ROLE) {
      await probeAdminAccessDenied()
      throw redirect({ to: '/403' })
    }
  },
  component: AuthenticatedLayout,
})
