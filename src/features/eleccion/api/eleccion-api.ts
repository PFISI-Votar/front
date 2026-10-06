import { apiClient } from '@/lib/api-client'
import type { ActaAperturaData } from '@/features/eleccion/data/acta-apertura-schema'
import type { ActaCierreData } from '@/features/eleccion/data/acta-cierre-schema'
import type {
  CreateComicioInput,
  Eleccion,
  EleccionEstado,
  EstadoSolicitudPausa,
} from '@/features/eleccion/data/schema'

export const crearEleccion = async (
  input: CreateComicioInput
): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>('/elecciones', input)
  return data
}

export const actualizarEleccion = async (
  idEleccion: number,
  input: CreateComicioInput
): Promise<Eleccion> => {
  const { data } = await apiClient.patch<Eleccion>(
    `/elecciones/${idEleccion}`,
    input
  )
  return data
}

export const eliminarEleccion = async (idEleccion: number): Promise<void> => {
  await apiClient.delete(`/elecciones/${idEleccion}`)
}

export const listarElecciones = async (
  estado?: EleccionEstado
): Promise<Eleccion[]> => {
  const { data } = await apiClient.get<Eleccion[]>('/elecciones', {
    params: estado ? { estado } : undefined,
  })
  return data
}

export const obtenerEleccion = async (
  idEleccion: number
): Promise<Eleccion> => {
  const { data } = await apiClient.get<Eleccion>(`/elecciones/${idEleccion}`)
  return data
}

export const abrirEleccion = async (idEleccion: number): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/abrir`
  )
  return data
}

export const cerrarEleccion = async (idEleccion: number): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/cerrar`
  )
  return data
}

/**
 * VOTAR-347 — solicita o confirma la pausa de emergencia. La primera autoridad
 * crea la solicitud (queda confirmada automáticamente); autoridades PAUSER
 * distintas que llamen después van sumando confirmaciones hasta el umbral,
 * momento en el que el backend ejecuta la transacción on-chain.
 */
export const pausarEleccion = async (
  idEleccion: number,
  razon: string
): Promise<EstadoSolicitudPausa> => {
  const { data } = await apiClient.post<EstadoSolicitudPausa>(
    `/elecciones/${idEleccion}/pausar`,
    { razon }
  )
  return data
}

/**
 * VOTAR-347 — mismo esquema de confirmación que pausarEleccion. La
 * justificación es obligatoria: queda vinculada al hash de la tx on-chain
 * en el Audit Log.
 */
export const reanudarEleccion = async (
  idEleccion: number,
  razon: string
): Promise<EstadoSolicitudPausa> => {
  const { data } = await apiClient.post<EstadoSolicitudPausa>(
    `/elecciones/${idEleccion}/reanudar`,
    { razon }
  )
  return data
}

export const obtenerEstadoPausa = async (
  idEleccion: number
): Promise<EstadoSolicitudPausa> => {
  const { data } = await apiClient.get<EstadoSolicitudPausa>(
    `/elecciones/${idEleccion}/pausar/estado`
  )
  return data
}

export const archivarEleccion = async (
  idEleccion: number
): Promise<Eleccion> => {
  const { data } = await apiClient.post<Eleccion>(
    `/elecciones/${idEleccion}/archivar`
  )
  return data
}

export const obtenerActaApertura = async (
  idEleccion: number
): Promise<ActaAperturaData> => {
  const { data } = await apiClient.get<ActaAperturaData>(
    `/elecciones/${idEleccion}/acta-apertura`
  )
  return data
}

export const obtenerActaCierre = async (
  idEleccion: number
): Promise<ActaCierreData> => {
  const { data } = await apiClient.get<ActaCierreData>(
    `/elecciones/${idEleccion}/acta-cierre`
  )
  return data
}

export const registrarHashActaCierre = async (
  idEleccion: number,
  hashPdf: string
): Promise<void> => {
  await apiClient.post(`/elecciones/${idEleccion}/acta-cierre/hash`, {
    hashPdf,
  })
}
