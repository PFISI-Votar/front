import { apiClient } from '@/lib/api-client'
import type {
  CreateListaInput,
  DespliegueOnChainResponse,
  Lista,
  ListaMapeoItem,
  OficializarResponse,
  StackOnChainStatus,
} from '@/features/eleccion/lista/data/schema'

export const listarListas = async (idEleccion: number): Promise<Lista[]> => {
  const { data } = await apiClient.get<Lista[]>(
    `/elecciones/${idEleccion}/listas`
  )
  return data
}

export const crearLista = async (
  idEleccion: number,
  input: CreateListaInput
): Promise<Lista> => {
  const { logoFile, ...listaInput } = input
  delete listaInput.removeLogo
  const payload = {
    ...listaInput,
    color: listaInput.color || undefined,
  }
  const { data: lista } = await apiClient.post<Lista>(
    `/elecciones/${idEleccion}/listas`,
    payload
  )
  if (logoFile) {
    try {
      return await subirLogoLista(lista.idLista, logoFile)
    } catch (error) {
      await eliminarLista(lista.idLista).catch(() => undefined)
      throw error
    }
  }
  return lista
}

export const actualizarLista = async (
  idLista: number,
  input: Partial<CreateListaInput>
): Promise<Lista> => {
  const { logoFile, removeLogo, ...listaInput } = input
  const { data: lista } = await apiClient.patch<Lista>(
    `/listas/${idLista}`,
    listaInput
  )
  if (logoFile) {
    return subirLogoLista(idLista, logoFile)
  }
  if (removeLogo) {
    return eliminarLogoLista(idLista)
  }
  return lista
}

export const eliminarLista = async (idLista: number): Promise<void> => {
  await apiClient.delete(`/listas/${idLista}`)
}

export const subirLogoLista = async (
  idLista: number,
  file: File
): Promise<Lista> => {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await apiClient.patch<Lista>(
    `/listas/${idLista}/logo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export const eliminarLogoLista = async (idLista: number): Promise<Lista> => {
  const { data } = await apiClient.delete<Lista>(`/listas/${idLista}/logo`)
  return data
}

export const oficializarEleccion = async (
  idEleccion: number
): Promise<OficializarResponse> => {
  const { data } = await apiClient.post<OficializarResponse>(
    `/elecciones/${idEleccion}/oficializar`
  )
  return data
}

export const obtenerEstadoStackOnChain = async (
  idEleccion: number
): Promise<StackOnChainStatus> => {
  const { data } = await apiClient.get<StackOnChainStatus>(
    `/elecciones/${idEleccion}/stack-on-chain`
  )
  return data
}

export const reintentarDespliegueOnChain = async (
  idEleccion: number
): Promise<DespliegueOnChainResponse> => {
  const { data } = await apiClient.post<DespliegueOnChainResponse>(
    `/elecciones/${idEleccion}/reintentar-despliegue-on-chain`
  )
  return data
}

export const obtenerMapeoListas = async (
  idEleccion: number
): Promise<ListaMapeoItem[]> => {
  const { data } = await apiClient.get<ListaMapeoItem[]>(
    `/elecciones/${idEleccion}/listas/mapeo`
  )
  return data
}
