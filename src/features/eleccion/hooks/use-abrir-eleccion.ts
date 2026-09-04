import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage, isPreconditionFailedError } from '@/lib/api-client'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { isMissingOnChainContractsError } from '@/features/eleccion/lib/missing-on-chain-contracts'
import { abrirEleccion } from '../api/eleccion-api'

type UseAbrirEleccionOptions = {
  onPreconditionError?: (message: string) => void
  /** VOTAR-473: comicio oficializado sin contratos on-chain. */
  onMissingOnChainContracts?: (message: string) => void
  onSuccess?: () => void
  padronPath?: string
}

export const useAbrirEleccion = (
  idEleccion: number,
  options: UseAbrirEleccionOptions = {}
) => {
  const {
    onPreconditionError,
    onMissingOnChainContracts,
    onSuccess,
    padronPath,
  } = options
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const isRunningRef = useRef(false)

  const invalidateEleccion = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
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
        loadingMessage: 'Abriendo comicio...',
        successMessage: 'Comicio abierto correctamente.',
        errorTitle: 'No se pudo abrir el comicio',
        errorDuration: 8_000,
        operation: () => abrirEleccion(idEleccion),
        onSuccess: () => {
          setLastError(null)
          invalidateEleccion()
          onSuccess?.()
        },
        onError: (error) => {
          const message = getApiErrorMessage(error)

          if (isPreconditionFailedError(error)) {
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
          }

          if (isMissingOnChainContractsError(message)) {
            onMissingOnChainContracts?.(message)
            setLastError(message)
            return true
          }

          setLastError(message)
          // Sin toast persistente: el botón cambia a «Reintentar apertura».
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
    onMissingOnChainContracts,
    onPreconditionError,
    onSuccess,
    padronPath,
  ])

  return { runInBackground, isRunning, lastError, clearLastError }
}
