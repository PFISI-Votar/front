import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { obtenerActaApertura } from '../api/eleccion-api'
import { generarActaAperturaPdf } from '../lib/generar-acta-apertura-pdf'

export const useGenerarActaApertura = () => {
  return useMutation({
    mutationFn: async (idEleccion: number) => {
      const data = await obtenerActaApertura(idEleccion)
      await generarActaAperturaPdf(data)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
