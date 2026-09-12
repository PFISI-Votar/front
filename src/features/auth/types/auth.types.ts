export type JwtRole = 'election_admin' | 'voter'

export interface AuthUser {
  sub: string
  role: JwtRole
  email?: string
  name?: string
}

export type TwoFactorStatus = 'setup_required' | 'verification_required'

export interface TwoFactorChallenge {
  status: TwoFactorStatus
  challengeToken: string
  otpauthUrl?: string
  secret?: string
}

export interface AuthResponse {
  user?: AuthUser
  twoFactor?: TwoFactorChallenge
}

export const ELECTION_ADMIN_ROLE: JwtRole = 'election_admin'

/** Intervalo de renovación proactiva (14 min, alineado a access de 15 min). */
export const ACCESS_REFRESH_INTERVAL_MS = 14 * 60 * 1000

/**
 * VOTAR-492 §12.2 — timeout por inactividad de la sesión admin (default 30 min,
 * alineado a `SESSION_IDLE_TIMEOUT` del backend). Configurable por entorno.
 */
export const SESSION_IDLE_TIMEOUT_MS = Number(
  import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MS ?? 30 * 60 * 1000
)

/** VOTAR-492 §12.2 — alcance del bloqueo de flujos de autenticación. */
export type AuthBloqueoAlcance = 'NINGUNO' | 'ADMIN' | 'TODOS'

export interface SesionActiva {
  idSession: number
  identificadorSso: string
  sub: string
  email: string | null
  nombre: string | null
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  actual: boolean
}

export interface RevocacionResultado {
  sesionesRevocadas: number
  alcance: 'PROPIA' | 'USUARIO' | 'GLOBAL'
}
