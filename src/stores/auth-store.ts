import { create } from 'zustand'
import {
  ELECTION_ADMIN_ROLE,
  type AuthUser,
} from '@/features/auth/types/auth.types'

interface AuthState {
  auth: {
    user: AuthUser | null
    setSession: (user: AuthUser) => void
    setUser: (user: AuthUser | null) => void
    reset: () => void
    isAuthenticated: () => boolean
    isElectionAdmin: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: null,
    setSession: (user) => {
      set((state) => ({
        ...state,
        auth: { ...state.auth, user },
      }))
    },
    setUser: (user) => {
      set((state) => ({ ...state, auth: { ...state.auth, user } }))
    },
    reset: () => {
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null },
      }))
    },
    isAuthenticated: () => Boolean(get().auth.user),
    isElectionAdmin: () => get().auth.user?.role === ELECTION_ADMIN_ROLE,
  },
}))
