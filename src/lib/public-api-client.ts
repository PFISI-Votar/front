import axios from 'axios'

/**
 * Cliente HTTP para endpoints públicos del Portal de Transparencia.
 * No envía cookies ni intenta refresh de sesión (VOTAR-315).
 */
export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})
