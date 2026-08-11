import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guardarConfiguracionVotoNulo,
  obtenerConfiguracionVotoNulo,
} from '@/features/eleccion/configuracion-comicio/api/configuracion-voto-nulo-api'
import type { GuardarConfiguracionVotoNuloInput } from '@/features/eleccion/configuracion-comicio/data/schema'

export const configuracionVotoNuloQueryKey = (idEleccion: number) =>
  ['configuracion-voto-nulo', idEleccion] as const

export const useConfiguracionVotoNulo = (idEleccion: number) =>
  useQuery({
    queryKey: configuracionVotoNuloQueryKey(idEleccion),
    queryFn: () => obtenerConfiguracionVotoNulo(idEleccion),
  })

export const useGuardarConfiguracionVotoNulo = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuardarConfiguracionVotoNuloInput) =>
      guardarConfiguracionVotoNulo(idEleccion, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: configuracionVotoNuloQueryKey(idEleccion),
      })
    },
  })
}
