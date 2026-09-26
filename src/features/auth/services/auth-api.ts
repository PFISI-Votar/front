import { apiClient } from '@/lib/api-client'
import type {
  AuthResponse,
  AuthUser,
  RevocacionResultado,
  SesionActiva,
} from '@/features/auth/types/auth.types'

export interface LoginInput {
  nick: string
  password: string
}

export interface VerifyTwoFactorInput {
  challengeToken: string
  code: string
}

export interface ResetTwoFactorInput {
  password: string
}

export interface TwoFactorStatusResponse {
  enabled: boolean
}

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input)
  return data
}

export const verifyTwoFactor = async (
  input: VerifyTwoFactorInput
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/2fa/verify', input)
  return data
}

export const getTwoFactorStatus =
  async (): Promise<TwoFactorStatusResponse> => {
    const { data } =
      await apiClient.get<TwoFactorStatusResponse>('/auth/2fa/status')
    return data
  }

export const resetTwoFactor = async (
  input: ResetTwoFactorInput
): Promise<void> => {
  await apiClient.post('/auth/2fa/reset', input)
}

export const getCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<AuthUser>('/auth/me')
  return data
}

export const refreshSession = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh')
  return data
}

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout')
}

/** VOTAR-492 §12.2 — sesiones de refresh activas de autoridades electorales. */
export const listarSesionesActivas = async (): Promise<SesionActiva[]> => {
  const { data } = await apiClient.get<SesionActiva[]>('/auth/sessions')
  return data
}

/** Cierra todas las sesiones propias excepto la actual. */
export const cerrarOtrasSesiones = async (): Promise<RevocacionResultado> => {
  const { data } = await apiClient.delete<RevocacionResultado>(
    '/auth/sessions/otras'
  )
  return data
}

/** Revoca todas las sesiones activas de un usuario (rol PAUSER). */
export const revocarSesionesUsuario = async (input: {
  identificadorSso: string
  motivo: string
}): Promise<RevocacionResultado> => {
  const { data } = await apiClient.post<RevocacionResultado>(
    '/auth/sessions/revocar',
    input
  )
  return data
}

/** Revocación global de todas las sesiones activas (rol PAUSER). */
export const revocarTodasLasSesiones = async (input: {
  motivo: string
  preservarSesionActual?: boolean
}): Promise<RevocacionResultado> => {
  const { data } = await apiClient.post<RevocacionResultado>(
    '/auth/sessions/revocar-todas',
    { ...input, confirmacion: 'REVOCAR_TODAS_LAS_SESIONES' }
  )
  return data
}
