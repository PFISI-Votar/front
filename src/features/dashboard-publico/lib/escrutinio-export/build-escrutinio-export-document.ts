import {
  escrutinioSchema,
  type Escrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import type {
  EscrutinioExportDocument,
  EscrutinioExportFormat,
  EscrutinioResumenCategoria,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

const buildResumenPorCategoria = (
  candidatos: Escrutinio['candidatos']
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
      candidatos: [candidato],
    })
  }
  return [...byCategoria.values()].sort(
    (a, b) =>
      a.idCategoria - b.idCategoria ||
      a.nombreCategoria.localeCompare(b.nombreCategoria)
  )
}

export const buildEscrutinioExportDocument = (
  escrutinio: Escrutinio,
  formato: EscrutinioExportFormat,
  exportadoEn = new Date().toISOString()
): EscrutinioExportDocument => {
  const validated = escrutinioSchema.parse(escrutinio)
  return {
    metadata: {
      idEleccion: validated.idEleccion,
      nombre: validated.nombre,
      estado: validated.estado,
      fuente: validated.fuente,
      actualizadoEn: validated.actualizadoEn,
      exportadoEn,
      formato,
      version: '1.0',
    },
    participacion: validated.participacion,
    candidatos: validated.candidatos,
    resumenPorCategoria: buildResumenPorCategoria(validated.candidatos),
  }
}
