import axios, { AxiosError } from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const isConflictError = (error: unknown): error is AxiosError => {
  return error instanceof AxiosError && error.response?.status === 409
}

export const isValidationError = (error: unknown): error is AxiosError => {
  const status = error instanceof AxiosError ? error.response?.status : 0
  return status === 422 || status === 400
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) {
      return data.message.join(', ')
    }
    if (typeof data?.message === 'string') {
      return data.message
    }
  }
  return 'Ocurrió un error inesperado'
}

export type ApiFieldError = {
  clave: string
  message: string
}

export const getApiFieldErrors = (error: unknown): ApiFieldError[] => {
  if (!(error instanceof AxiosError)) {
    return []
  }
  const data = error.response?.data as { errors?: ApiFieldError[] } | undefined
  if (!Array.isArray(data?.errors)) {
    return []
  }
  return data.errors
}
