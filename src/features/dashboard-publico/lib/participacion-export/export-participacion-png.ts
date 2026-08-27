import { toBlob } from 'html-to-image'
import { descargarArchivo } from '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo'
import { buildParticipacionExportFilename } from '@/features/dashboard-publico/lib/participacion-export/participacion-export-filename'

const PIXEL_RATIO = 2

type ExportParticipacionPngParams = {
  node: HTMLElement
  idEleccion: number
  nombreComicio: string
  exportadoEn?: Date
}

export const exportParticipacionPng = async ({
  node,
  idEleccion,
  nombreComicio,
  exportadoEn = new Date(),
}: ExportParticipacionPngParams): Promise<void> => {
  const blob = await toBlob(node, {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: '#ffffff',
  })

  if (!blob) {
    throw new Error(
      'No se pudo generar la imagen PNG de la curva de participación.'
    )
  }

  const nombreArchivo = buildParticipacionExportFilename(
    idEleccion,
    nombreComicio,
    exportadoEn
  )
  descargarArchivo(blob, nombreArchivo)
}
