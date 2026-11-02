import { afterEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'

describe('resolveMediaUrl', () => {
  const originalBaseUrl = apiClient.defaults.baseURL

  afterEach(() => {
    apiClient.defaults.baseURL = originalBaseUrl
  })

  it('devuelve undefined si no hay url', () => {
    expect(resolveMediaUrl(undefined)).toBeUndefined()
    expect(resolveMediaUrl(null)).toBeUndefined()
    expect(resolveMediaUrl('')).toBeUndefined()
  })

  it('deja intactas las urls absolutas', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png'
    )
  })

  it('conserva el prefijo /api cuando la base es relativa (proxy de Vercel)', () => {
    apiClient.defaults.baseURL = '/api'
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost'
    expect(resolveMediaUrl('/imagenes/7')).toBe(`${origin}/api/imagenes/7`)
  })

  it('usa la base absoluta del backend', () => {
    apiClient.defaults.baseURL = 'https://votar-back.vercel.app/'
    expect(resolveMediaUrl('imagenes/7')).toBe(
      'https://votar-back.vercel.app/imagenes/7'
    )
  })
})
