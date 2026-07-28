import type {
  CandidatoEscrutinio,
  ParticipacionEscrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import type {
  EscrutinioResumenCategoria,
  EscrutinioResumenLista,
  EscrutinioVotoBlanco,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

export const calcularBaseVotosValidos = (
  participacion: ParticipacionEscrutinio
): number => Math.max(0, participacion.totalVotos - participacion.votosNulo)

export const calcularPorcentajeVotos = (
  votos: number,
  baseVotosValidos: number
): number =>
  baseVotosValidos > 0 ? Math.round((votos / baseVotosValidos) * 1000) / 10 : 0

export const buildVotoEnBlanco = (
  participacion: ParticipacionEscrutinio,
  baseVotosValidos: number
): EscrutinioVotoBlanco | null => {
  if (participacion.votosBlanco <= 0) {
    return null
  }
  return {
    votos: participacion.votosBlanco,
    porcentaje: calcularPorcentajeVotos(
      participacion.votosBlanco,
      baseVotosValidos
    ),
  }
}

export const buildResumenPorCategoria = (
  candidatos: CandidatoEscrutinio[],
  baseVotosValidos: number
): EscrutinioResumenCategoria[] => {
  const byCategoria = new Map<number, EscrutinioResumenCategoria>()
  for (const candidato of candidatos) {
    const existing = byCategoria.get(candidato.idCategoria)
    if (existing) {
      existing.candidatos.push(candidato)
      existing.totalVotosCategoria += candidato.votos
      continue
    }
    byCategoria.set(candidato.idCategoria, {
      idCategoria: candidato.idCategoria,
      nombreCategoria: candidato.nombreCategoria,
      totalVotosCategoria: candidato.votos,
      porcentaje: 0,
      candidatos: [candidato],
    })
  }
  return [...byCategoria.values()]
    .sort(
      (a, b) =>
        a.idCategoria - b.idCategoria ||
        a.nombreCategoria.localeCompare(b.nombreCategoria)
    )
    .map((categoria) => ({
      ...categoria,
      porcentaje: calcularPorcentajeVotos(
        categoria.totalVotosCategoria,
        baseVotosValidos
      ),
    }))
}

export const buildResumenPorLista = (
  candidatos: CandidatoEscrutinio[],
  baseVotosValidos: number
): EscrutinioResumenLista[] => {
  const byLista = new Map<number, EscrutinioResumenLista>()
  for (const candidato of candidatos) {
    const existing = byLista.get(candidato.idLista)
    if (existing) {
      existing.candidatos.push(candidato)
      existing.totalVotosLista = Math.max(
        existing.totalVotosLista,
        candidato.votos
      )
      continue
    }
    byLista.set(candidato.idLista, {
      idLista: candidato.idLista,
      nombreLista: candidato.nombreLista,
      siglaLista: candidato.siglaLista,
      colorLista: candidato.colorLista,
      totalVotosLista: candidato.votos,
      porcentaje: calcularPorcentajeVotos(candidato.votos, baseVotosValidos),
      candidatos: [candidato],
    })
  }
  return [...byLista.values()]
    .sort(
      (a, b) =>
        b.totalVotosLista - a.totalVotosLista ||
        a.nombreLista.localeCompare(b.nombreLista)
    )
    .map((lista) => ({
      ...lista,
      porcentaje: calcularPorcentajeVotos(
        lista.totalVotosLista,
        baseVotosValidos
      ),
    }))
}
