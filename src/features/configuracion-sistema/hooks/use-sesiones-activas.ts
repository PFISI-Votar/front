import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  cerrarOtrasSesiones,
  listarSesionesActivas,
  revocarSesionesUsuario,
  revocarTodasLasSesiones,
} from '@/features/auth/services/auth-api'
import { actualizarAuthBloqueo } from '@/features/configuracion-sistema/api/configuracion-sistema-api'
import type { AuthBloqueoAlcance } from '@/features/configuracion-sistema/data/schema'

const SESIONES_ACTIVAS_QUERY_KEY = ['auth', 'sesiones-activas']
const CONFIGURACION_SISTEMA_QUERY_KEY = ['configuracion-sistema']

export const useSesionesActivas = () =>
  useQuery({
    queryKey: SESIONES_ACTIVAS_QUERY_KEY,
    queryFn: listarSesionesActivas,
  })

export const useCerrarOtrasSesiones = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cerrarOtrasSesiones,
    onSuccess: (resultado) => {
      toast.success(
        `Se cerraron ${resultado.sesionesRevocadas} sesión(es) además de la actual.`
      )
      queryClient.invalidateQueries({ queryKey: SESIONES_ACTIVAS_QUERY_KEY })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useRevocarSesionesUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { identificadorSso: string; motivo: string }) =>
      revocarSesionesUsuario(input),
    onSuccess: (resultado) => {
      toast.success(
        `Se revocaron ${resultado.sesionesRevocadas} sesión(es) del usuario.`
      )
      queryClient.invalidateQueries({ queryKey: SESIONES_ACTIVAS_QUERY_KEY })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useRevocarTodasLasSesiones = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { motivo: string; preservarSesionActual?: boolean }) =>
      revocarTodasLasSesiones(input),
    onSuccess: (resultado) => {
      toast.success(
        `Revocación global: ${resultado.sesionesRevocadas} sesión(es) cerradas.`
      )
      queryClient.invalidateQueries({ queryKey: SESIONES_ACTIVAS_QUERY_KEY })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useActualizarAuthBloqueo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { alcance: AuthBloqueoAlcance; motivo?: string }) =>
      actualizarAuthBloqueo(input),
    onSuccess: (config) => {
      toast.success(
        config.authBloqueoAlcance === 'NINGUNO'
          ? 'Bloqueo de autenticación desactivado.'
          : `Bloqueo de autenticación activado (alcance ${config.authBloqueoAlcance}).`
      )
      queryClient.invalidateQueries({
        queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
