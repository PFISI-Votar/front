import type { EleccionEstado } from '@/features/eleccion/data/schema'

const ESTADO_LABEL: Record<EleccionEstado, string> = {
  BORRADOR: 'Borrador',
  CONFIGURADA: 'En preparación',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  ESCRUTADA: 'Escrutada',
}

export const getEstadoEleccionLabel = (
  estado: EleccionEstado | string
): string => {
  if (estado in ESTADO_LABEL) {
    return ESTADO_LABEL[estado as EleccionEstado]
  }
  return estado
}

export const getEstadoEleccionBadgeVariant = (
  estado: EleccionEstado | string
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (estado === 'ABIERTA') return 'default'
  if (estado === 'CONFIGURADA') return 'default'
  if (estado === 'BORRADOR') return 'secondary'
  if (estado === 'CERRADA') return 'destructive'
  return 'outline'
}
