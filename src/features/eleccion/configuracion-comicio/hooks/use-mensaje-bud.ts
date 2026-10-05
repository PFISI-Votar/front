import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guardarMensajeBud,
  obtenerMensajeBud,
} from '@/features/eleccion/configuracion-comicio/api/mensaje-bud-api'
import type { GuardarMensajeBudInput } from '@/features/eleccion/configuracion-comicio/data/schema'

export const mensajeBudQueryKey = (idEleccion: number) =>
  ['mensaje-bud', idEleccion] as const

export const useMensajeBud = (idEleccion: number) =>
  useQuery({
    queryKey: mensajeBudQueryKey(idEleccion),
    queryFn: () => obtenerMensajeBud(idEleccion),
  })

export const useGuardarMensajeBud = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuardarMensajeBudInput) =>
      guardarMensajeBud(idEleccion, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mensajeBudQueryKey(idEleccion),
      })
      await queryClient.invalidateQueries({
        queryKey: ['bud-config', idEleccion],
      })
      await queryClient.invalidateQueries({
        queryKey: ['eleccion', idEleccion],
      })
    },
  })
}
