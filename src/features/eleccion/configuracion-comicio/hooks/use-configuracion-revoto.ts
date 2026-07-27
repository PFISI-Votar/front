import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guardarConfiguracionRevoto,
  obtenerConfiguracionRevoto,
} from '@/features/eleccion/configuracion-comicio/api/configuracion-revoto-api'
import type { GuardarConfiguracionRevotoInput } from '@/features/eleccion/configuracion-comicio/data/schema'

export const configuracionRevotoQueryKey = (idEleccion: number) =>
  ['configuracion-revoto', idEleccion] as const

export const useConfiguracionRevoto = (idEleccion: number) =>
  useQuery({
    queryKey: configuracionRevotoQueryKey(idEleccion),
    queryFn: () => obtenerConfiguracionRevoto(idEleccion),
  })

export const useGuardarConfiguracionRevoto = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuardarConfiguracionRevotoInput) =>
      guardarConfiguracionRevoto(idEleccion, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: configuracionRevotoQueryKey(idEleccion),
      })
    },
  })
}
