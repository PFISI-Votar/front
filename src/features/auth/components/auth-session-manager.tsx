import { useEffect } from 'react'
import {
  clearAccessTokenRefresh,
  scheduleAccessTokenRefresh,
} from '@/features/auth/services/auth-session'
import { useAuthStore } from '@/stores/auth-store'

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
