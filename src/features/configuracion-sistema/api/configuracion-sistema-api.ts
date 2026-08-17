import { apiClient } from '@/lib/api-client'
import type {
  ActaAperturaModo,
  ActaAperturaPlantilla,
  ConfiguracionSistema,
} from '@/features/configuracion-sistema/data/schema'

export const obtenerConfiguracionSistema =
  async (): Promise<ConfiguracionSistema> => {
    const { data } = await apiClient.get<ConfiguracionSistema>(
      '/configuracion-sistema'
    )
    return data
  }

export const subirLogoInstitucional = async (
  file: File
): Promise<ConfiguracionSistema> => {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await apiClient.patch<ConfiguracionSistema>(
    '/configuracion-sistema/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export const eliminarLogoInstitucional =
  async (): Promise<ConfiguracionSistema> => {
    const { data } = await apiClient.delete<ConfiguracionSistema>(
      '/configuracion-sistema/logo'
    )
    return data
  }

export const actualizarPlantillaActaApertura = async (
  patch: Partial<ActaAperturaPlantilla>
): Promise<ConfiguracionSistema> => {
  const { data } = await apiClient.patch<ConfiguracionSistema>(
    '/configuracion-sistema/acta-apertura-plantilla',
    patch
  )
  return data
}

export const actualizarFormatoPersonalizadoActaApertura = async (patch: {
  modo?: ActaAperturaModo
  plantillaTexto?: string
}): Promise<ConfiguracionSistema> => {
  const { data } = await apiClient.patch<ConfiguracionSistema>(
    '/configuracion-sistema/acta-apertura-formato',
    patch
  )
  return data
}
