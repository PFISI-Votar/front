import type {
  CandidatoEscrutinio,
  Escrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  buildResumenPorCategoria,
  buildResumenPorLista,
  calcularBaseVotosValidos,
  calcularPorcentajeVotos,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-calculos'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

export type BarChartDatum = {
  /** Stable key for React / recharts cells (candidato or lista). */
  id: string
  name: string
  votos: number
  fill: string
}

export type DonutChartDatum = {
  name: string
  value: number
  fill: string
}

export type CategoriaDonutSeries = {
  idCategoria: number
  nombreCategoria: string
  data: DonutChartDatum[]
}

export type GanadorEntry = {
  puesto: number
  label: string
  sublabel?: string
  votos: number
  porcentaje: number
  fill: string
}

export type GanadoresGrupo = {
  titulo: string
  entradas: GanadorEntry[]
}

const DEFAULT_COLORS = [
  '#2f6f9f',
  '#3d8bb8',
  '#5a9fc4',
  '#7ab3d0',
  '#9ac7dc',
  '#b9dbe8',
]

const colorAt = (index: number, preferred: string | null | undefined) =>
  preferred ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]!

const blankNuloExtras = (
  escrutinio: Escrutinio,
  options: { permitirVotoNulo?: boolean } = {}
): DonutChartDatum[] => {
  const permitirVotoNulo = options.permitirVotoNulo ?? true
  const extras: DonutChartDatum[] = []
  if (escrutinio.participacion.votosBlanco > 0) {
    extras.push({
      name: 'En blanco',
      value: escrutinio.participacion.votosBlanco,
      fill: '#9aa0a6',
    })
  }
  if (permitirVotoNulo && escrutinio.participacion.votosNulo > 0) {
    extras.push({
      name: 'Nulos',
      value: escrutinio.participacion.votosNulo,
      fill: '#5f6368',
    })
  }
  return extras
}

/**
 * Transforms escrutinio API payload into recharts-friendly series.
 * POR_LISTA → one bar per lista (VOTAR-464); otherwise per candidato.
 */
export const toBarChartData = (escrutinio: Escrutinio): BarChartDatum[] => {
  if (escrutinio.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    const base = calcularBaseVotosValidos(escrutinio.participacion)
    return buildResumenPorLista(escrutinio.candidatos, base).map(
      (lista, index) => ({
        id: `lista-${lista.idLista}`,
        name: lista.siglaLista
          ? `${lista.nombreLista} (${lista.siglaLista})`
          : lista.nombreLista,
        votos: lista.totalVotosLista,
        fill: colorAt(index, lista.colorLista),
      })
    )
  }

  return escrutinio.candidatos.map((candidato, index) => ({
    id: `candidato-${candidato.idCandidato}`,
    name: formatCandidatoLabel(candidato),
    votos: candidato.votos,
    fill: colorAt(index, candidato.colorLista),
  }))
}

export const toDonutChartData = (
  escrutinio: Escrutinio,
  options: { permitirVotoNulo?: boolean } = {}
): DonutChartDatum[] => {
  if (escrutinio.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    const base = calcularBaseVotosValidos(escrutinio.participacion)
    const partisan = buildResumenPorLista(escrutinio.candidatos, base)
      .filter((lista) => lista.totalVotosLista > 0)
      .slice(0, 6)
      .map((lista, index) => ({
        name: lista.siglaLista ?? lista.nombreLista,
        value: lista.totalVotosLista,
        fill: colorAt(index, lista.colorLista),
      }))
    return [...partisan, ...blankNuloExtras(escrutinio, options)]
  }

  const partisan = escrutinio.candidatos
    .filter((c) => c.votos > 0)
    .slice(0, 6)
    .map((candidato, index) => ({
      name: formatCandidatoLabel(candidato),
      value: candidato.votos,
      fill: colorAt(index, candidato.colorLista),
    }))
  return [...partisan, ...blankNuloExtras(escrutinio, options)]
}

/**
 * One donut series per cargo (VOTAR-464 feedback on “mixto” / POR_CANDIDATO).
 * Blank/null stay global — only partisan tallies appear per category.
 */
export const toDonutChartDataByCategoria = (
  escrutinio: Escrutinio
): CategoriaDonutSeries[] => {
  const base = calcularBaseVotosValidos(escrutinio.participacion)
  return buildResumenPorCategoria(escrutinio.candidatos, base).map(
    (categoria) => {
      const ranked = [...categoria.candidatos].sort(
        (a, b) =>
          b.votos - a.votos ||
          a.apellido.localeCompare(b.apellido) ||
          a.nombre.localeCompare(b.nombre)
      )
      return {
        idCategoria: categoria.idCategoria,
        nombreCategoria: categoria.nombreCategoria,
        data: ranked
          .filter((candidato) => candidato.votos > 0)
          .map((candidato, index) => ({
            name: formatCandidatoLabel(candidato),
            value: candidato.votos,
            fill: colorAt(index, candidato.colorLista),
          })),
      }
    }
  )
}

/**
 * Ranked winners for the results modal (VOTAR-464).
 * POR_LISTA → lists; POR_CANDIDATO → one group per category.
 */
export const buildGanadores = (escrutinio: Escrutinio): GanadoresGrupo[] => {
  const base = calcularBaseVotosValidos(escrutinio.participacion)

  if (escrutinio.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    const listas = buildResumenPorLista(escrutinio.candidatos, base)
    return [
      {
        titulo: 'Por lista',
        entradas: listas.map((lista, index) => ({
          puesto: index + 1,
          label: lista.siglaLista
            ? `${lista.nombreLista} (${lista.siglaLista})`
            : lista.nombreLista,
          votos: lista.totalVotosLista,
          porcentaje: lista.porcentaje,
          fill: colorAt(index, lista.colorLista),
        })),
      },
    ]
  }

  return buildResumenPorCategoria(escrutinio.candidatos, base).map(
    (categoria) => {
      const ranked = [...categoria.candidatos].sort(
        (a, b) =>
          b.votos - a.votos ||
          a.apellido.localeCompare(b.apellido) ||
          a.nombre.localeCompare(b.nombre)
      )
      const categoryBase = Math.max(
        1,
        ranked.reduce((sum, c) => sum + c.votos, 0)
      )
      return {
        titulo: categoria.nombreCategoria,
        entradas: ranked.map((candidato, index) => ({
          puesto: index + 1,
          label: `${candidato.apellido}, ${candidato.nombre}`,
          sublabel: candidato.siglaLista ?? candidato.nombreLista,
          votos: candidato.votos,
          porcentaje: calcularPorcentajeVotos(candidato.votos, categoryBase),
          fill: colorAt(index, candidato.colorLista),
        })),
      }
    }
  )
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

export const barChartTitleFor = (tipoVotacion: string): string =>
  tipoVotacion === TIPOS_VOTACION.POR_LISTA
    ? 'Votos por lista'
    : 'Votos por candidato'
