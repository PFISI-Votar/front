import type { CandidatoBoletaDigital } from '@/features/voto/data/schema'

export const getInitials = (value: string): string => {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[words.length - 1]?.[0] ?? ''}`.toUpperCase()
}

export const getListLogoUrl = (
  candidate: CandidatoBoletaDigital
): string | null =>
  candidate.logoListaUrl ??
  candidate.imagenListaUrl ??
  candidate.fotoListaUrl ??
  null

export type ListaPublicaGroup = {
  idLista: number
  numeroLista: number
  nombre: string
  color: string
  logoUrl: string | null
  candidatos: CandidatoBoletaDigital[]
}

export const groupCandidatosByLista = (
  candidatos: CandidatoBoletaDigital[]
): ListaPublicaGroup[] => {
  const groups = new Map<number, ListaPublicaGroup>()

  candidatos.forEach((candidato) => {
    const existing = groups.get(candidato.idLista)
    if (existing) {
      existing.candidatos.push(candidato)
      return
    }
    groups.set(candidato.idLista, {
      idLista: candidato.idLista,
      numeroLista: candidato.numeroLista,
      nombre: candidato.agrupacionPolitica,
      color: candidato.colorLista || '#2f6f9f',
      logoUrl: getListLogoUrl(candidato),
      candidatos: [candidato],
    })
  })

  return Array.from(groups.values()).sort(
    (a, b) => a.numeroLista - b.numeroLista || a.nombre.localeCompare(b.nombre)
  )
}
