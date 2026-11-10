import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guardarPopupAlerta,
  obtenerPopupAlerta,
} from '@/features/eleccion/configuracion-comicio/api/popup-alerta-api'
import type { GuardarPopupAlertaInput } from '@/features/eleccion/configuracion-comicio/data/schema'

export const popupAlertaQueryKey = (idEleccion: number) =>
  ['popup-alerta', idEleccion] as const

export const usePopupAlerta = (idEleccion: number) =>
  useQuery({
    queryKey: popupAlertaQueryKey(idEleccion),
    queryFn: () => obtenerPopupAlerta(idEleccion),
  })

export const useGuardarPopupAlerta = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuardarPopupAlertaInput) =>
      guardarPopupAlerta(idEleccion, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: popupAlertaQueryKey(idEleccion),
      })
      await queryClient.invalidateQueries({
        queryKey: ['bud-config', idEleccion],
      })
    },
  })
}
