/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest'
import { resolveMediaUrl, toSafeImageSrc } from './media-url'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    defaults: { baseURL: 'https://api.example.com' },
  },
}))

describe('toSafeImageSrc', () => {
  it.each([
    'https://cdn.example.com/logo.png',
    'http://localhost:3000/foto.jpg',
    'blob:https://app.example.com/11111111-1111-1111-1111-111111111111',
  ])('acepta %s', (url) => {
    expect(toSafeImageSrc(url)).toBe(url)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:image/png;base64,aaa',
    'https://cdn.example.com/logo.png"><img src=x onerror=alert(1)>',
    '/media/logo.png',
    '',
    null,
    undefined,
  ])('rechaza %s', (url) => {
    expect(toSafeImageSrc(url)).toBeUndefined()
  })
})

describe('resolveMediaUrl', () => {
  it('resuelve rutas relativas contra el API', () => {
    expect(resolveMediaUrl('/media/logo.png')).toBe(
      'https://api.example.com/media/logo.png'
    )
  })

  it('conserva URLs http(s) absolutas', () => {
    expect(resolveMediaUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png'
    )
  })

  it('rechaza esquemas no seguros aunque el API las resuelva', () => {
    expect(resolveMediaUrl('javascript:alert(1)')).toBeUndefined()
  })
})
