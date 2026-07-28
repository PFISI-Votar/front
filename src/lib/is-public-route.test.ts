import { describe, expect, it } from 'vitest'
import { isPublicRoute } from './is-public-route'

describe('isPublicRoute', () => {
  it('reconoce el dashboard público y sus sub-rutas (VOTAR-315)', () => {
    expect(isPublicRoute('/comicios/6/dashboard')).toBe(true)
    expect(isPublicRoute('/comicios/6/dashboard/')).toBe(true)
    expect(isPublicRoute('/comicios/6/dashboard/padron')).toBe(true)
    expect(isPublicRoute('/comicios/6/dashboard/participacion')).toBe(true)
    expect(isPublicRoute('/comicios/12/dashboard/estado')).toBe(true)
  })

  it('reconoce la BUD y el verificador público', () => {
    expect(isPublicRoute('/comicios/6/votar')).toBe(true)
    expect(isPublicRoute('/verificar')).toBe(true)
    expect(isPublicRoute('/verificar/0xabc')).toBe(true)
  })

  it('no marca rutas administrativas o de login', () => {
    expect(isPublicRoute('/')).toBe(false)
    expect(isPublicRoute('/sign-in')).toBe(false)
    expect(isPublicRoute('/comicios')).toBe(false)
    expect(isPublicRoute('/comicios/6')).toBe(false)
    expect(isPublicRoute('/comicios/6/editar')).toBe(false)
  })
})
