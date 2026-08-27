import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { reanudarEleccion } from '../api/eleccion-api'

export const useReanudarEleccion = (idEleccion: number) => {
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const isRunningRef = useRef(false)

  const invalidatePausa = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({
      queryKey: ['solicitud-pausa', idEleccion],
    })
  }, [idEleccion, queryClient])

  const runInBackground = useCallback(
    (razon: string) => {
      if (isRunningRef.current) {
        return
      }

      isRunningRef.current = true
      setIsRunning(true)

      runBackgroundOperation({
        loadingMessage: 'Procesando confirmación de reanudación...',
        successMessage: (estado) =>
          estado?.ejecutada
            ? 'Comicio reanudado correctamente.'
            : `Confirmación registrada (${estado?.confirmaciones}/${estado?.requeridas}). Falta que otra autoridad PAUSER confirme.`,
        errorTitle: 'No se pudo reanudar el comicio',
        operation: () => reanudarEleccion(idEleccion, razon),
        onSuccess: invalidatePausa,
        onSettled: () => {
          isRunningRef.current = false
          setIsRunning(false)
        },
      })
    },
    [idEleccion, invalidatePausa]
  )

  return { runInBackground, isRunning }
}
