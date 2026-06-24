import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import {
  ELECTION_ADMIN_ROLE,
  type JwtRole,
} from '@/features/auth/types/auth.types'
import {
  decodeJwtPayload,
  getPersistedAuth,
  isTokenExpired,
  useAuthStore,
} from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const { accessToken, user } = getPersistedAuth()

    if (!accessToken || isTokenExpired(accessToken)) {
      useAuthStore.getState().auth.reset()
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    const tokenRole = decodeJwtPayload(accessToken)?.role as JwtRole | undefined
    const role = user?.role ?? tokenRole

    if (role !== ELECTION_ADMIN_ROLE) {
      throw redirect({ to: '/403' })
    }
  },
  component: AuthenticatedLayout,
})
