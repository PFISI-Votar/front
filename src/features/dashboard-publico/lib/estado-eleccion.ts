import type { EleccionEstado } from '@/features/eleccion/data/schema'

const ESTADO_LABEL: Record<EleccionEstado, string> = {
  BORRADOR: 'Borrador',
  CONFIGURADA: 'En preparación',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  ESCRUTADA: 'Escrutada',
  ARCHIVADA: 'Archivada',
}

export const getEstadoEleccionLabel = (estado: string): string => {
  if (estado in ESTADO_LABEL) {
    return ESTADO_LABEL[estado as EleccionEstado]
  }
  return estado
}

export const getEstadoEleccionBadgeClass = (estado: string): string => {
  if (estado === 'ABIERTA') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (estado === 'CONFIGURADA') {
    return 'border-sky-200 bg-sky-50 text-sky-800'
  }
  if (
    estado === 'CERRADA' ||
    estado === 'ESCRUTADA' ||
    estado === 'ARCHIVADA'
  ) {
    return 'border-slate-200 bg-slate-100 text-slate-700'
  }
  if (estado === 'DESCONOCIDO') {
    return 'border-red-200 bg-red-50 text-red-800'
  }
  return 'border-amber-200 bg-amber-50 text-amber-900'
}
