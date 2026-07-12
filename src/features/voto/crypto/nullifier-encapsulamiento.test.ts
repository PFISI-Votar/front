import { describe, expect, it } from 'vitest'
import { calcularNullifier } from './nullifier'

/**
 * UAT-04: el nulificador no debe quedar expuesto en el objeto global.
 * El cálculo real ocurre just-in-time en `BudVotingWizard.handleSignVote`
 * (closure local) y el valor solo se entrega a `signVotePayload`; la UI
 * de éxito no lo renderiza (cubierto en `bud-voting-wizard.test.tsx`).
 */
const CREDENCIAL_MOCK =
  '0x04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c'
const ID_ELECCION_MOCK = 12

describe('UAT-04 (Protección XSS): el nulificador no es accesible desde la consola', () => {
  it('no queda expuesto en globalThis luego de calcularse', () => {
    const nullifier = calcularNullifier(CREDENCIAL_MOCK, ID_ELECCION_MOCK)

    const clavesGlobales = JSON.stringify(Object.keys(globalThis))
    expect(clavesGlobales).not.toContain(nullifier)
    expect(Object.prototype.hasOwnProperty.call(globalThis, nullifier)).toBe(
      false
    )
  })

  it('el valor calculado no se asigna implícitamente a propiedades globales', () => {
    const nullifier = calcularNullifier(CREDENCIAL_MOCK, ID_ELECCION_MOCK)
    const globalSnapshot = Object.getOwnPropertyNames(globalThis)

    expect(globalSnapshot.some((key) => key.includes(nullifier.slice(2)))).toBe(
      false
    )
  })
})
