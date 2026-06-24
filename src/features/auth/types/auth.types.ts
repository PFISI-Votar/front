export type JwtRole = 'election_admin' | 'voter'

export interface AuthUser {
  sub: string
  role: JwtRole
  email?: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
}

export const ELECTION_ADMIN_ROLE: JwtRole = 'election_admin'

/** Intervalo de renovación proactiva (14 min, alineado a access de 15 min). */
export const ACCESS_REFRESH_INTERVAL_MS = 14 * 60 * 1000
