import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage, isValidationError } from '@/lib/api-client'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { oficializarEleccion } from '../lista/api/lista-api'
import type { OficializarResponse } from '../lista/data/schema'

type UseOficializarEleccionOptions = {
  onValidationError?: (error: unknown) => void
  onSuccess?: (data: OficializarResponse) => void
  /** Called when oficialización DB OK but on-chain deploy failed (VOTAR-473). */
  onOnChainDeployFailed?: (data: OficializarResponse) => void
  showMapeoToast?: boolean
}

export const useOficializarEleccion = (
  idEleccion: number,
  options: UseOficializarEleccionOptions = {}
) => {
  const {
    onValidationError,
    onSuccess,
    onOnChainDeployFailed,
    showMapeoToast = false,
  } = options
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const isRunningRef = useRef(false)

  const invalidateEleccion = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['listas-mapeo', idEleccion] })
    queryClient.invalidateQueries({
      queryKey: ['eleccion-stack-on-chain', idEleccion],
    })
  }, [idEleccion, queryClient])

  const clearLastError = useCallback(() => {
    setLastError(null)
  }, [])

  const runInBackground = useCallback(() => {
    const attempt = (): void => {
      if (isRunningRef.current || idEleccion <= 0) {
        return
      }

      isRunningRef.current = true
      setIsRunning(true)
      setLastError(null)

      runBackgroundOperation({
        loadingMessage: 'Oficializando comicio...',
        successMessage: (data) =>
          data.onChainDesplegado
            ? 'Comicio oficializado'
            : 'Comicio oficializado — falta desplegar contratos on-chain',
        errorTitle: 'No se pudo oficializar el comicio',
        errorDuration: 8_000,
        operation: () => oficializarEleccion(idEleccion),
        onSuccess: (data) => {
          setLastError(null)
          invalidateEleccion()
          onSuccess?.(data)
          if (!data.onChainDesplegado) {
            onOnChainDeployFailed?.(data)
            toast.warning(
              'La oficialización quedó pendiente on-chain. Usá «Reintentar oficialización».'
            )
          }
          if (showMapeoToast && data.mapeo.length > 0) {
            toast.info(
              `Mapeo generado: ${data.mapeo.map((m) => `${m.sigla}→list_id ${m.listId}`).join(', ')}`
            )
          }
        },
        onError: (error) => {
          if (isValidationError(error) && onValidationError) {
            onValidationError(error)
            return true
          }

          setLastError(getApiErrorMessage(error))
          // Sin toast persistente: el botón cambia a «Reintentar oficialización».
          return true
        },
        onSettled: () => {
          isRunningRef.current = false
          setIsRunning(false)
        },
      })
    }

    attempt()
  }, [
    idEleccion,
    invalidateEleccion,
    onOnChainDeployFailed,
    onSuccess,
    onValidationError,
    showMapeoToast,
  ])

  return { runInBackground, isRunning, lastError, clearLastError }
}
