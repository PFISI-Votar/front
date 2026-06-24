export type JwtRole = 'election_admin' | 'voter'

export interface AuthUser {
  sub: string
  role: JwtRole
  email?: string
  name?: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export const ELECTION_ADMIN_ROLE: JwtRole = 'election_admin'
