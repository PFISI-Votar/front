import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'

type CandidatoCategoriaRef = Pick<Candidato, 'idCategoria' | 'idCandidato'>

type GetCategoriasDisponiblesOptions = {
  excludeCandidatoId?: number
  includeCategoriaId?: number
}

const countCandidatosPorCategoria = (
  candidatos: CandidatoCategoriaRef[],
  idCategoria: number,
  excludeCandidatoId?: number,
): number =>
  candidatos.filter(
    (candidato) =>
      candidato.idCategoria === idCategoria &&
      candidato.idCandidato !== excludeCandidatoId,
  ).length

export const getCategoriasDisponibles = (
  categorias: CategoriaElectoral[],
  candidatos: CandidatoCategoriaRef[],
  options?: GetCategoriasDisponiblesOptions,
): CategoriaElectoral[] =>
  categorias.filter((categoria) => {
    if (options?.includeCategoriaId === categoria.idCategoria) {
      return true
    }
    const count = countCandidatosPorCategoria(
      candidatos,
      categoria.idCategoria,
      options?.excludeCandidatoId,
    )
    return count < categoria.maximoPostulantes
  })
