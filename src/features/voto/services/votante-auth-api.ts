import { votanteApiClient } from '@/lib/votante-api-client'
import type {
  VotanteAuthResponse,
  VotanteAuthUser,
  VotanteLoginInput,
} from '@/features/voto/types/votante-auth.types'

export const loginVotante = async (
  input: VotanteLoginInput
): Promise<VotanteAuthResponse> => {
  const { data } = await votanteApiClient.post<VotanteAuthResponse>(
    '/auth/votante/login',
    input
  )
  return data
}

export const startGoogleVoterLogin = (idEleccion: number): void => {
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const url = new URL(`${apiBase}/auth/votante/google`, window.location.origin)
  url.searchParams.set('idEleccion', String(idEleccion))
  window.location.assign(url.toString())
}

export const getVotanteSession = async (): Promise<VotanteAuthUser> => {
  const { data } =
    await votanteApiClient.get<VotanteAuthUser>('/auth/votante/me')
  return data
}

export const logoutVotante = async (): Promise<void> => {
  await votanteApiClient.post('/auth/votante/logout')
}
