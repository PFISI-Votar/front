import { apiClient } from '@/lib/api-client'
import type { AuthResponse } from '@/features/auth/types/auth.types'

export interface LoginInput {
  nick: string
  password: string
}

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input)
  return data
}
