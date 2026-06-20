import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import type { RolCandidato } from '@/features/eleccion/data/schema'

type CandidatoRolRef = Pick<Candidato, 'idCategoria' | 'idCandidato'>

type GetRolesDisponiblesOptions = {
  excludeCandidatoId?: number
  includeCategoriaId?: number
}

const countCandidatosPorRol = (
  candidatos: CandidatoRolRef[],
  idCategoria: number,
  excludeCandidatoId?: number,
): number =>
  candidatos.filter(
    (candidato) =>
      candidato.idCategoria === idCategoria &&
      candidato.idCandidato !== excludeCandidatoId,
  ).length

export const getRolesDisponibles = (
  roles: RolCandidato[],
  candidatos: CandidatoRolRef[],
  options?: GetRolesDisponiblesOptions,
): RolCandidato[] =>
  roles.filter((rol) => {
    if (options?.includeCategoriaId === rol.idCategoria) {
      return true
    }
    const count = countCandidatosPorRol(
      candidatos,
      rol.idCategoria,
      options?.excludeCandidatoId,
    )
    return count < rol.maximoPostulantes
  })
