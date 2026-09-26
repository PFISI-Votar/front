import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage, isConflictError } from '@/lib/api-client'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { cerrarEleccion } from '../api/eleccion-api'

type UseCerrarEleccionOptions = {
  onSuccess?: () => void
}

export const useCerrarEleccion = (
  idEleccion: number,
  options: UseCerrarEleccionOptions = {}
) => {
  const { onSuccess } = options
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const isRunningRef = useRef(false)

  const invalidateEleccion = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({
      queryKey: ['dashboard-publico-comicio', idEleccion],
    })
  }, [idEleccion, queryClient])

  const runInBackground = useCallback(() => {
    if (isRunningRef.current) {
      return
    }

    isRunningRef.current = true
    setIsRunning(true)

    runBackgroundOperation({
      loadingMessage: 'Cerrando comicio...',
      successMessage: 'Comicio cerrado correctamente.',
      errorTitle: 'No se pudo cerrar el comicio',
      operation: () => cerrarEleccion(idEleccion),
      onSuccess: () => {
        invalidateEleccion()
        onSuccess?.()
      },
      onError: (error) => {
        // VOTAR-481: un 409 significa que el scheduler automático (u otro
        // admin) ya está abriendo/cerrando este comicio — no es una falla
        // real, a diferencia del "No se pudo cerrar el comicio" genérico.
        // Paridad con el 409 de useAbrirEleccion.
        if (isConflictError(error)) {
          toast.warning(getApiErrorMessage(error), { duration: 8_000 })
          return true
        }
      },
      onSettled: () => {
        isRunningRef.current = false
        setIsRunning(false)
      },
    })
  }, [idEleccion, invalidateEleccion, onSuccess])

  return { runInBackground, isRunning }
}
