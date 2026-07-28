import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage, isPreconditionFailedError } from '@/lib/api-client'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { abrirEleccion } from '../api/eleccion-api'

type UseAbrirEleccionOptions = {
  onPreconditionError?: (message: string) => void
  onSuccess?: () => void
  padronPath?: string
}

export const useAbrirEleccion = (
  idEleccion: number,
  options: UseAbrirEleccionOptions = {}
) => {
  const { onPreconditionError, onSuccess, padronPath } = options
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const isRunningRef = useRef(false)

  const invalidateEleccion = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
  }, [idEleccion, queryClient])

  const runInBackground = useCallback(() => {
    const attempt = (): void => {
      if (isRunningRef.current) {
        return
      }

      isRunningRef.current = true
      setIsRunning(true)

      runBackgroundOperation({
        loadingMessage: 'Abriendo comicio...',
        successMessage: 'Comicio abierto correctamente.',
        errorTitle: 'No se pudo abrir el comicio',
        operation: () => abrirEleccion(idEleccion),
        onSuccess: () => {
          invalidateEleccion()
          onSuccess?.()
        },
        onError: (error) => {
          if (!isPreconditionFailedError(error)) {
            return
          }

          const message = getApiErrorMessage(error)
          onPreconditionError?.(message)

          return {
            label: padronPath ? 'Ver padrón' : 'Reintentar',
            onClick: () => {
              if (padronPath) {
                window.location.assign(padronPath)
                return
              }
              attempt()
            },
          }
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
    onPreconditionError,
    onSuccess,
    padronPath,
  ])

  return { runInBackground, isRunning }
}
