import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { archivarEleccion } from '../api/eleccion-api'

export const useArchivarEleccion = (idEleccion: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => archivarEleccion(idEleccion),
    onSuccess: () => {
      toast.success('Comicio archivado correctamente.')
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
