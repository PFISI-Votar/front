import { apiClient } from '@/lib/api-client'
import type {
  BoletaDigital,
  ConfirmarVotoInput,
  ConfirmarVotoResponse,
} from '@/features/voto/data/schema'

export const VOTANTE_TOKEN_STORAGE_KEY = 'votar:votante-token'
export const VOTANTE_TOKEN_HEADER = 'x-votante-token'

export const getVotanteTokenStorageKey = (idEleccion: number) =>
  `${VOTANTE_TOKEN_STORAGE_KEY}:${idEleccion}`

export const getVotanteToken = (idEleccion: number): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(getVotanteTokenStorageKey(idEleccion))
}

export const setVotanteToken = (idEleccion: number, token: string) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(getVotanteTokenStorageKey(idEleccion), token)
}

export const createDemoVotanteToken = () => {
  const bytes = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256)
    })
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const buildVotanteHeaders = (idEleccion: number) => {
  const token = getVotanteToken(idEleccion)
  return token ? { [VOTANTE_TOKEN_HEADER]: token } : {}
}

export const obtenerBoletaDigital = async (
  idEleccion: number
): Promise<BoletaDigital> => {
  const { data } = await apiClient.get<BoletaDigital>(
    `/elecciones/${idEleccion}/boleta-digital`,
    { headers: buildVotanteHeaders(idEleccion) }
  )
  return data
}

export const confirmarVoto = async (
  idEleccion: number,
  input: ConfirmarVotoInput
): Promise<ConfirmarVotoResponse> => {
  const { data } = await apiClient.post<ConfirmarVotoResponse>(
    `/elecciones/${idEleccion}/votos/confirmar`,
    input,
    { headers: buildVotanteHeaders(idEleccion) }
  )
  return data
}
