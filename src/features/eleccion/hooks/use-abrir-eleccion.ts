import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { abrirEleccion } from '../api/eleccion-api'

export const useAbrirEleccion = (idEleccion: number) => {
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
      if (message.includes('Fallo de Precondición')) {
        toast.error('No se puede abrir el comicio', {
          description: message,
        })
      } else {
        toast.error(message)
      }
    },
  })
}
