import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  actualizarFormatoPersonalizadoActaApertura,
  actualizarPlantillaActaApertura,
  eliminarLogoInstitucional,
  obtenerConfiguracionSistema,
  subirLogoInstitucional,
} from '@/features/configuracion-sistema/api/configuracion-sistema-api'
import type {
  ActaAperturaModo,
  ActaAperturaPlantilla,
} from '@/features/configuracion-sistema/data/schema'

const CONFIGURACION_SISTEMA_QUERY_KEY = ['configuracion-sistema']

export const useConfiguracionSistema = () =>
  useQuery({
    queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
    queryFn: obtenerConfiguracionSistema,
  })

export const useSubirLogoInstitucional = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => subirLogoInstitucional(file),
    onSuccess: () => {
      toast.success('Logo institucional actualizado.')
      queryClient.invalidateQueries({
        queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useEliminarLogoInstitucional = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: eliminarLogoInstitucional,
    onSuccess: () => {
      toast.success('Logo institucional eliminado.')
      queryClient.invalidateQueries({
        queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useActualizarFormatoPersonalizadoActaApertura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: { modo?: ActaAperturaModo; plantillaTexto?: string }) =>
      actualizarFormatoPersonalizadoActaApertura(patch),
    onSuccess: () => {
      toast.success('Formato del Acta de Apertura actualizado.')
      queryClient.invalidateQueries({
        queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useActualizarPlantillaActaApertura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: Partial<ActaAperturaPlantilla>) =>
      actualizarPlantillaActaApertura(patch),
    onSuccess: () => {
      toast.success('Plantilla del Acta de Apertura actualizada.')
      queryClient.invalidateQueries({
        queryKey: CONFIGURACION_SISTEMA_QUERY_KEY,
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
