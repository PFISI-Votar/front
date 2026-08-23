import axios from 'axios'
import { VOTANTE_API_TIMEOUT_MS } from '@/features/voto/crypto/constants'

export const votanteApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
  timeout: VOTANTE_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})
