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

export const getVotanteSession = async (): Promise<VotanteAuthUser> => {
  const { data } = await votanteApiClient.get<VotanteAuthUser>(
    '/auth/votante/me'
  )
  return data
}

export const logoutVotante = async (): Promise<void> => {
  await votanteApiClient.post('/auth/votante/logout')
}
