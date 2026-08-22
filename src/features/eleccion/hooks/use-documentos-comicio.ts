import { useGenerarActaApertura } from '@/features/eleccion/hooks/use-generar-acta-apertura'
import { useGenerarActaCierre } from '@/features/eleccion/hooks/use-generar-acta-cierre'
import type { DocumentoComicioId } from '@/features/eleccion/lib/documentos-comicio'

/**
 * Mapea cada `DocumentoComicioId` a la mutation que genera y descarga su
 * PDF. El menú "Actas oficiales" solo conoce ids y estados de `pending`;
 * agregar un documento nuevo es sumar su hook acá, sin tocar el componente
 * de menú.
 */
export const useDocumentosComicio = () => {
  const actaApertura = useGenerarActaApertura()
  const actaCierre = useGenerarActaCierre()

  const mutations: Record<
    DocumentoComicioId,
    { mutate: (idEleccion: number) => void; isPending: boolean }
  > = {
    'acta-apertura': actaApertura,
    'acta-cierre': actaCierre,
  }

  return mutations
}
