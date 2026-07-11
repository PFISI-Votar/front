import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getApiErrorMessage,
  isPreconditionFailedError,
} from '@/lib/api-client'
import { abrirEleccion } from '../api/eleccion-api'

export const useAbrirEleccion = (
  idEleccion: number,
  onPreconditionError?: (message: string) => void
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => abrirEleccion(idEleccion),
    onSuccess: () => {
      toast.success('Comicio abierto correctamente.')
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    },
    onError: (error) => {
      const message = getApiErrorMessage(error)
      if (isPreconditionFailedError(error)) {
        // Si hay un callback para manejar el error 412, llamarlo
        if (onPreconditionError) {
          onPreconditionError(message)
        } else {
          toast.error('No se puede abrir el comicio', {
            description: message,
          })
        }
      } else {
        toast.error(message)
      }
    },
  })
}
