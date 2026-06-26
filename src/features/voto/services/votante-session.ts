import {
  getVotanteSession,
  logoutVotante,
} from '@/features/voto/services/votante-auth-api'
import {
  VOTER_ROLE,
  type VotanteAuthUser,
} from '@/features/voto/types/votante-auth.types'

export const ensureVotanteSession = async (
  idEleccion: number
): Promise<VotanteAuthUser | null> => {
  try {
    const user = await getVotanteSession()
    if (user.role !== VOTER_ROLE || user.idEleccion !== idEleccion) {
      await logoutVotante()
      return null
    }
    return user
  } catch {
    return null
  }
}

export const clearVotanteSession = async (): Promise<void> => {
  try {
    await logoutVotante()
  } catch {
    // La cookie puede estar ya expirada o ausente.
  }
}
