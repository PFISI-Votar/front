import { apiClient } from '@/lib/api-client'
import type { AuthResponse, AuthUser } from '@/features/auth/types/auth.types'

export interface LoginInput {
  nick: string
  password: string
}

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input)
  return data
}

export const getCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<AuthUser>('/auth/me')
  return data
}

export const refreshSession = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh')
  return data
}

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout')
}
