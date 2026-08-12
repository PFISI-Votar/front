import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerEstadoRevoto,
  registrarConsumoIntento,
} from '@/features/voto/api/voto-api'
import type { EstadoRevoto } from '@/features/voto/data/schema'

export const estadoRevotoQueryKey = (idEleccion: number) =>
  ['estado-revoto', idEleccion] as const

/** VOTAR-328: estado de intentos restantes desde revotePolicyService. */
export const useEstadoRevoto = (idEleccion: number, enabled = true) => {
  return useQuery<EstadoRevoto, Error>({
    queryKey: estadoRevotoQueryKey(idEleccion),
    queryFn: () => obtenerEstadoRevoto(idEleccion),
    enabled,
    staleTime: 15_000,
    retry: 1,
  })
}

export const useRegistrarConsumoIntento = (idEleccion: number) => {
  const queryClient = useQueryClient()
  return useMutation<EstadoRevoto, Error, number | undefined>({
    mutationFn: (votosObjetivo) =>
      registrarConsumoIntento(idEleccion, votosObjetivo),
    onSuccess: (data) => {
      queryClient.setQueryData(estadoRevotoQueryKey(idEleccion), data)
    },
    // VOTAR-325: HTTP 429 con cooldown activo — el estado en caché quedó
    // obsoleto (el cliente creía que podía sufragar). Forzar refetch para
    // sincronizar con el tiempo real del servidor (UAT-01).
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: estadoRevotoQueryKey(idEleccion),
      })
    },
  })
}
