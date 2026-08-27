import { slugifyNombreComicio } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-filename'

export const buildParticipacionExportFilename = (
  idEleccion: number,
  nombre: string,
  exportadoEn = new Date()
): string => {
  const slug = slugifyNombreComicio(nombre)
  const fecha = exportadoEn.toISOString().slice(0, 10).replace(/-/g, '')
  return `participacion-${idEleccion}-${slug}-${fecha}.png`
}
