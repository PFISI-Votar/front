import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  clearAccessTokenRefresh,
  scheduleAccessTokenRefresh,
} from '@/features/auth/services/auth-session'

export const AuthSessionManager = () => {
  const user = useAuthStore((state) => state.auth.user)

  useEffect(() => {
    if (!user) {
      clearAccessTokenRefresh()
      return
    }

    scheduleAccessTokenRefresh()
    return () => {
      clearAccessTokenRefresh()
    }
  }, [user])

  return null
}
