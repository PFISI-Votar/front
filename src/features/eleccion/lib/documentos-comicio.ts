import type { EleccionEstado } from '@/features/eleccion/data/schema'

/**
 * Registro extensible de documentos oficiales descargables por comicio
 * (VOTAR-374). Agregar un documento nuevo es sumar una entrada acá + su
 * mutation en `use-documentos-comicio.ts`; no requiere tocar el menú
 * "Actas oficiales".
 */
export type DocumentoComicioId = 'acta-apertura' | 'acta-cierre'

export type DocumentoComicio = {
  id: DocumentoComicioId
  label: string
  estadosDisponibles: EleccionEstado[]
}

export const DOCUMENTOS_COMICIO: DocumentoComicio[] = [
  {
    id: 'acta-apertura',
    label: 'Acta de Apertura',
    estadosDisponibles: ['ABIERTA', 'CERRADA', 'ESCRUTADA', 'ARCHIVADA'],
  },
  {
    id: 'acta-cierre',
    label: 'Acta de Cierre',
    estadosDisponibles: ['CERRADA', 'ESCRUTADA', 'ARCHIVADA'],
  },
]

export const obtenerDocumentosDisponibles = (
  estado: EleccionEstado
): DocumentoComicio[] =>
  DOCUMENTOS_COMICIO.filter((documento) =>
    documento.estadosDisponibles.includes(estado)
  )
