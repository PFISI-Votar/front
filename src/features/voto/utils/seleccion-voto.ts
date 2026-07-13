import type {
  BoletaDigital,
  CandidatoBoletaDigital,
  CategoriaBoletaDigital,
  SeleccionesPorCategoria,
  SeleccionVoto,
} from '@/features/voto/data/schema'

export const seleccionarCandidato = (
  selecciones: SeleccionesPorCategoria,
  idCategoria: number,
  idCandidato: number
): SeleccionesPorCategoria => ({
  ...selecciones,
  [idCategoria]: idCandidato,
})

export const buildSeleccionesVoto = (
  selecciones: SeleccionesPorCategoria
): SeleccionVoto[] =>
  Object.entries(selecciones)
    .map(([idCategoria, idCandidato]) => ({
      idCategoria: Number(idCategoria),
      idCandidato,
    }))
    .sort(
      (a, b) => a.idCategoria - b.idCategoria || a.idCandidato - b.idCandidato
    )

export const getTotalCandidatos = (categorias: CategoriaBoletaDigital[]) =>
  categorias.reduce(
    (total, categoria) => total + categoria.candidatos.length,
    0
  )

export const getCategoriasSinSeleccion = (
  boleta: BoletaDigital,
  selecciones: SeleccionesPorCategoria
) =>
  boleta.categorias.filter(
    (categoria) =>
      categoria.candidatos.length > 0 &&
      selecciones[categoria.idCategoria] === undefined
  )

export const getCategoriasSinCandidatos = (boleta: BoletaDigital) =>
  boleta.categorias.filter((categoria) => categoria.candidatos.length === 0)

export const findCandidatoSeleccionado = (
  boleta: BoletaDigital,
  idCategoria: number,
  idCandidato: number | undefined
): CandidatoBoletaDigital | undefined => {
  if (idCandidato === undefined) {
    return undefined
  }
  return boleta.categorias
    .find((categoria) => categoria.idCategoria === idCategoria)
    ?.candidatos.find((candidato) => candidato.idCandidato === idCandidato)
}
