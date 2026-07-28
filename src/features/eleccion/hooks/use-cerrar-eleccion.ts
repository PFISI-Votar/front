import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { cerrarEleccion } from '../api/eleccion-api'

export const useCerrarEleccion = (idEleccion: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cerrarEleccion(idEleccion),
    onSuccess: () => {
      toast.success('Comicio cerrado correctamente.')
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
      queryClient.invalidateQueries({
        queryKey: ['dashboard-publico-comicio', idEleccion],
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
