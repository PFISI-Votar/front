import type { EleccionEstado } from '@/features/eleccion/data/schema'

const ESTADO_LABEL: Record<EleccionEstado, string> = {
  BORRADOR: 'Borrador',
  CONFIGURADA: 'En preparación',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  ESCRUTADA: 'Escrutada',
  ARCHIVADA: 'Archivada',
}

type EstadoComicioFinalizado = Extract<
  EleccionEstado,
  'CERRADA' | 'ESCRUTADA' | 'ARCHIVADA'
>

const ESTADOS_COMICIO_FINALIZADO = new Set<EleccionEstado>([
  'CERRADA',
  'ESCRUTADA',
  'ARCHIVADA',
])

/** Labels del badge en detalle de lista: dejan claro que hablan del comicio. */
const ESTADO_COMICIO_FINALIZADO_LABEL: Record<EstadoComicioFinalizado, string> =
  {
    CERRADA: 'Comicio cerrado',
    ESCRUTADA: 'Resultados escrutados',
    ARCHIVADA: 'Comicio archivado',
  }

const isEstadoComicioFinalizado = (
  estado: EleccionEstado
): estado is EstadoComicioFinalizado => ESTADOS_COMICIO_FINALIZADO.has(estado)

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
  if (estado === 'ARCHIVADA') return 'outline'
  return 'outline'
}

/**
 * Badge del detalle de lista: muestra estado de la lista mientras el comicio
 * sigue activo; cuando el comicio terminó, prioriza el estado del comicio.
 */
export const getListaEstadoBadgeLabel = (
  estadoLista: string,
  estadoComicio: EleccionEstado | undefined
): string => {
  if (estadoComicio && isEstadoComicioFinalizado(estadoComicio)) {
    return ESTADO_COMICIO_FINALIZADO_LABEL[estadoComicio]
  }
  return estadoLista
}
