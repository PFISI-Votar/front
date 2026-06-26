export type JwtRole = 'election_admin' | 'voter'

export interface VotanteAuthUser {
  sub: string
  role: JwtRole
  idEleccion: number
  email?: string
  name?: string
}

export interface VotanteAuthResponse {
  user: VotanteAuthUser
}

export interface VotanteLoginInput {
  nick: string
  password: string
  idEleccion: number
}

/** TTL de sesión votante (30 min). Sin refresh automático. */
export const VOTER_SESSION_TTL_MS = 30 * 60 * 1000

export const VOTER_ROLE: JwtRole = 'voter'
