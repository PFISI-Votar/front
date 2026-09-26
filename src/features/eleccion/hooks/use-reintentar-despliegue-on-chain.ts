import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/lib/api-client'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { reintentarDespliegueOnChain } from '@/features/eleccion/lista/api/lista-api'

type UseReintentarDespliegueOnChainOptions = {
  onSuccess?: (idEleccion: number) => void
  onError?: (idEleccion: number, message: string) => void
}

export const useReintentarDespliegueOnChain = (
  options: UseReintentarDespliegueOnChainOptions = {}
) => {
  const { onSuccess, onError } = options
  const queryClient = useQueryClient()
  const [runningId, setRunningId] = useState<number | null>(null)
  const [lastError, setLastError] = useState<{
    idEleccion: number
    message: string
  } | null>(null)
  const isRunningRef = useRef(false)

  const clearLastError = useCallback(() => {
    setLastError(null)
  }, [])

  const runInBackground = useCallback(
    (idEleccion: number) => {
      if (idEleccion <= 0 || isRunningRef.current) {
        return
      }

      isRunningRef.current = true
      setRunningId(idEleccion)
      setLastError(null)

      runBackgroundOperation({
        loadingMessage: 'Reintentando oficialización on-chain...',
        successMessage: 'Contratos electorales desplegados correctamente.',
        errorTitle: 'No se pudo reintentar la oficialización',
        errorDuration: 8_000,
        operation: () => reintentarDespliegueOnChain(idEleccion),
        onSuccess: () => {
          setLastError(null)
          queryClient.invalidateQueries({ queryKey: ['elecciones'] })
          queryClient.invalidateQueries({
            queryKey: ['eleccion', idEleccion],
          })
          queryClient.invalidateQueries({
            queryKey: ['eleccion-stack-on-chain', idEleccion],
          })
          onSuccess?.(idEleccion)
        },
        onError: (error) => {
          const message = getApiErrorMessage(error)
          setLastError({ idEleccion, message })
          onError?.(idEleccion, message)
          return undefined
        },
        onSettled: () => {
          isRunningRef.current = false
          setRunningId(null)
        },
      })
    },
    [onError, onSuccess, queryClient]
  )

  return {
    runInBackground,
    isRunning: runningId !== null,
    runningId,
    lastError,
    clearLastError,
  }
}
