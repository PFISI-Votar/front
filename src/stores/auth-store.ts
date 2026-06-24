import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import {
  ELECTION_ADMIN_ROLE,
  type AuthUser,
  type JwtRole,
} from '@/features/auth/types/auth.types'

const ACCESS_TOKEN_KEY = 'votar_access_token'
const AUTH_USER_KEY = 'votar_auth_user'

interface AuthState {
  auth: {
    user: AuthUser | null
    accessToken: string
    setSession: (user: AuthUser, accessToken: string) => void
    setUser: (user: AuthUser | null) => void
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
    isElectionAdmin: () => boolean
    isTokenExpired: () => boolean
  }
}

const parseStoredUser = (raw: string | undefined): AuthUser | null => {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const decodeJwtPayload = (
  token: string,
): { exp?: number; role?: JwtRole; sub?: string } | null => {
  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) {
      return null
    }
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized)
    return JSON.parse(json) as { exp?: number; role?: JwtRole; sub?: string }
  } catch {
    return null
  }
}

export const getPersistedAuth = (): {
  accessToken: string
  user: AuthUser | null
} => {
  const accessToken = getCookie(ACCESS_TOKEN_KEY) ?? ''
  const user = parseStoredUser(getCookie(AUTH_USER_KEY))
  return { accessToken, user }
}

export const isTokenExpired = (accessToken: string): boolean => {
  if (!accessToken) {
    return true
  }
  const payload = decodeJwtPayload(accessToken)
  if (!payload?.exp) {
    return false
  }
  return payload.exp * 1000 <= Date.now()
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const persisted = getPersistedAuth()

  return {
    auth: {
      user: persisted.user,
      accessToken: persisted.accessToken,
      setSession: (user, accessToken) => {
        setCookie(ACCESS_TOKEN_KEY, accessToken)
        setCookie(AUTH_USER_KEY, JSON.stringify(user))
        set((state) => ({
          ...state,
          auth: { ...state.auth, user, accessToken },
        }))
      },
      setUser: (user) => {
        if (user) {
          setCookie(AUTH_USER_KEY, JSON.stringify(user))
        } else {
          removeCookie(AUTH_USER_KEY)
        }
        set((state) => ({ ...state, auth: { ...state.auth, user } }))
      },
      setAccessToken: (accessToken) => {
        setCookie(ACCESS_TOKEN_KEY, accessToken)
        set((state) => ({ ...state, auth: { ...state.auth, accessToken } }))
      },
      resetAccessToken: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } }))
      },
      reset: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        removeCookie(AUTH_USER_KEY)
        set((state) => ({
          ...state,
          auth: { ...state.auth, user: null, accessToken: '' },
        }))
      },
      isAuthenticated: () => {
        const { accessToken } = get().auth
        return Boolean(accessToken) && !isTokenExpired(accessToken)
      },
      isElectionAdmin: () => {
        const { user, accessToken } = get().auth
        if (!accessToken || isTokenExpired(accessToken)) {
          return false
        }
        const payloadRole = decodeJwtPayload(accessToken)?.role
        return (
          user?.role === ELECTION_ADMIN_ROLE ||
          payloadRole === ELECTION_ADMIN_ROLE
        )
      },
      isTokenExpired: () => isTokenExpired(get().auth.accessToken),
    },
  }
})
