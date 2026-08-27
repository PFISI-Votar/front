import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildEscrutinioExportFilename } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'
import type { EscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

export const buildEscrutinioJsonPayload = (
  document: EscrutinioExportDocument
): Record<string, unknown> => ({
  metadata: document.metadata,
  participacion: document.permitirVotoNulo
    ? document.participacion
    : {
        totalVotos: document.participacion.totalVotos,
        votosBlanco: document.participacion.votosBlanco,
        totalVotantesHabilitados:
          document.participacion.totalVotantesHabilitados,
        porcentajeParticipacion: document.participacion.porcentajeParticipacion,
      },
  candidatos: document.candidatos,
  resultados: document.resultados,
  permitirVotoNulo: document.permitirVotoNulo,
})

export const exportEscrutinioJson = (
  document: EscrutinioExportDocument
): void => {
  const contenido = JSON.stringify(
    buildEscrutinioJsonPayload(document),
    null,
    2
  )
  const blob = new Blob([contenido], { type: 'application/json;charset=utf-8' })
  const nombreArchivo = buildEscrutinioExportFilename(
    document.metadata.idEleccion,
    document.metadata.nombre,
    'json',
    new Date(document.metadata.exportadoEn)
  )
  descargarArchivo(blob, nombreArchivo)
}
