import type { EscrutinioExportFormat } from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'

const MAX_SLUG_LENGTH = 40

export const slugifyNombreComicio = (nombre: string): string => {
  const slug = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
  return slug.length > 0 ? slug : 'comicio'
}

export const buildEscrutinioExportFilename = (
  idEleccion: number,
  nombre: string,
  formato: EscrutinioExportFormat,
  exportadoEn = new Date()
): string => {
  const slug = slugifyNombreComicio(nombre)
  const fecha = exportadoEn.toISOString().slice(0, 10).replace(/-/g, '')
  return `escrutinio-${idEleccion}-${slug}-${fecha}.${formato}`
}
