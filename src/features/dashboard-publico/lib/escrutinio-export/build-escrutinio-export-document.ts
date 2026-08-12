import {
  escrutinioSchema,
  type Escrutinio,
} from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  buildResumenPorCategoria,
  buildResumenPorLista,
  buildVotoEnBlanco,
  calcularBaseVotosValidos,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-calculos'
import type {
  EscrutinioExportDocument,
  EscrutinioExportFormat,
  EscrutinioExportResultados,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const buildResultados = (
  escrutinio: Escrutinio
): EscrutinioExportResultados => {
  const baseVotosValidos = calcularBaseVotosValidos(escrutinio.participacion)
  const votoEnBlanco = buildVotoEnBlanco(
    escrutinio.participacion,
    baseVotosValidos
  )
  if (escrutinio.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    return {
      tipoVotacion: TIPOS_VOTACION.POR_LISTA,
      resumenPorLista: buildResumenPorLista(
        escrutinio.candidatos,
        baseVotosValidos
      ),
      votoEnBlanco,
    }
  }
  return {
    tipoVotacion: escrutinio.tipoVotacion,
    resumenPorCategoria: buildResumenPorCategoria(
      escrutinio.candidatos,
      baseVotosValidos
    ),
    votoEnBlanco,
  }
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
      tipoVotacion: validated.tipoVotacion,
      fuente: validated.fuente,
      actualizadoEn: validated.actualizadoEn,
      exportadoEn,
      formato,
      version: '1.0',
    },
    participacion: validated.participacion,
    candidatos: validated.candidatos,
    resultados: buildResultados(validated),
    permitirVotoNulo: validated.permitirVotoNulo ?? true,
  }
}
