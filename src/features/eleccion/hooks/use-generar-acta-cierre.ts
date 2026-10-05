import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  obtenerActaCierre,
  registrarHashActaCierre,
} from '@/features/eleccion/api/eleccion-api'
import {
  buildActaCierreFilename,
  construirActaCierrePdf,
} from '@/features/eleccion/lib/generar-acta-cierre-pdf'
import { hashPdfBytesSha256 } from '@/features/eleccion/lib/pdf-integrity'

/**
 * UAT-01: el PDF se genera y hashea client-side; el hash se registra en la
 * bitácora de auditoría ANTES de entregar la descarga, para que el
 * documento que el usuario efectivamente recibe sea siempre el mismo cuyo
 * hash ya quedó certificado. Si el registro del hash falla, no se
 * descarga nada (no debe circular un Acta "oficial" sin registro).
 *
 * Separada de `useGenerarActaCierre` para poder testear el orden de la
 * secuencia (generar → hashear → registrar → recién ahí descargar) sin
 * depender de React Query.
 */
export const generarYRegistrarActaCierre = async (
  idEleccion: number
): Promise<void> => {
  const data = await obtenerActaCierre(idEleccion)
  const doc = await construirActaCierrePdf(data)
  const bytes = doc.output('arraybuffer')
  const hash = await hashPdfBytesSha256(bytes)
  await registrarHashActaCierre(idEleccion, hash)
  doc.save(buildActaCierreFilename(data))
}

export const useGenerarActaCierre = () => {
  return useMutation({
    mutationFn: generarYRegistrarActaCierre,
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
