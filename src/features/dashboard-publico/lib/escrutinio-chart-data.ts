import type {
  CandidatoEscrutinio,
  Escrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'

export type BarChartDatum = {
  name: string
  votos: number
  fill: string
  idCandidato: number
}

export type DonutChartDatum = {
  name: string
  value: number
  fill: string
}

const DEFAULT_COLORS = [
  '#2f6f9f',
  '#3d8bb8',
  '#5a9fc4',
  '#7ab3d0',
  '#9ac7dc',
  '#b9dbe8',
]

/**
 * Transforms escrutinio API payload into recharts-friendly series.
 */
export const toBarChartData = (escrutinio: Escrutinio): BarChartDatum[] =>
  escrutinio.candidatos.map((candidato, index) => ({
    idCandidato: candidato.idCandidato,
    name: formatCandidatoLabel(candidato),
    votos: candidato.votos,
    fill: candidato.colorLista ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))

export const toDonutChartData = (escrutinio: Escrutinio): DonutChartDatum[] => {
  const partisan = escrutinio.candidatos
    .filter((c) => c.votos > 0)
    .slice(0, 6)
    .map((candidato, index) => ({
      name: formatCandidatoLabel(candidato),
      value: candidato.votos,
      fill:
        candidato.colorLista ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))
  const extras: DonutChartDatum[] = []
  if (escrutinio.participacion.votosBlanco > 0) {
    extras.push({
      name: 'En blanco',
      value: escrutinio.participacion.votosBlanco,
      fill: '#9aa0a6',
    })
  }
  if (escrutinio.participacion.votosNulo > 0) {
    extras.push({
      name: 'Nulos',
      value: escrutinio.participacion.votosNulo,
      fill: '#5f6368',
    })
  }
  return [...partisan, ...extras]
}

export const formatCandidatoLabel = (
  candidato: CandidatoEscrutinio
): string => {
  const fullName = `${candidato.apellido}, ${candidato.nombre}`
  if (candidato.siglaLista) {
    return `${fullName} (${candidato.siglaLista})`
  }
  return fullName
}

export const formatRelativeUpdate = (iso: string, now = Date.now()): string => {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return '—'
  const seconds = Math.max(0, Math.floor((now - then) / 1000))
  if (seconds < 5) return 'justo ahora'
  if (seconds < 60) return `hace ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  return new Date(iso).toLocaleString('es-AR')
}
