/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import {
  OBSERVACION_LOGIN_DEFAULT,
  resolveObservacionLoginVisible,
} from '@/features/eleccion/data/observacion-login'

describe('resolveObservacionLoginVisible', () => {
  it('usa el texto por defecto si la config todavía no llegó', () => {
    expect(resolveObservacionLoginVisible(undefined)).toBe(
      OBSERVACION_LOGIN_DEFAULT
    )
  })

  it('oculta el recuadro cuando la autoridad dejó el campo vacío', () => {
    expect(resolveObservacionLoginVisible(null)).toBeNull()
    expect(resolveObservacionLoginVisible('')).toBeNull()
    expect(resolveObservacionLoginVisible('   ')).toBeNull()
  })

  it('muestra el texto configurado en el borrador del comicio', () => {
    expect(
      resolveObservacionLoginVisible('  Ingresá con tu correo institucional.  ')
    ).toBe('Ingresá con tu correo institucional.')
  })
})
