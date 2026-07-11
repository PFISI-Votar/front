import { describe, expect, it } from 'vitest'
import {
  calcularNullifier,
  CredencialNulificadorInvalidaError,
} from './nullifier'

/**
 * Credenciales de prueba genéricas (simulan el formato hex de una clave
 * pública de billetera efímera secp256k1). No dependen de VOTAR-352.
 */
const CREDENCIAL_MOCK_A =
  '0x04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c'
const CREDENCIAL_MOCK_B =
  '0x04f2e8c1d3a5b7c9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7'

const ID_ELECCION_A = 12
const ID_ELECCION_B = 99

describe('calcularNullifier', () => {
  it('UAT-01 (Determinismo): misma credencial + mismo idEleccion → mismo nulificador', () => {
    const actualNullifier1 = calcularNullifier(CREDENCIAL_MOCK_A, ID_ELECCION_A)
    const actualNullifier2 = calcularNullifier(CREDENCIAL_MOCK_A, ID_ELECCION_A)

    expect(actualNullifier1).toBe(actualNullifier2)
  })

  it('UAT-02 (Unicidad cross-election): misma credencial, distinto idEleccion → nulificadores distintos', () => {
    const actualNullifierEleccionA = calcularNullifier(
      CREDENCIAL_MOCK_A,
      ID_ELECCION_A
    )
    const actualNullifierEleccionB = calcularNullifier(
      CREDENCIAL_MOCK_A,
      ID_ELECCION_B
    )

    expect(actualNullifierEleccionA).not.toBe(actualNullifierEleccionB)
  })

  it('distintas credenciales, misma elección → nulificadores distintos', () => {
    const actualNullifierCredencialA = calcularNullifier(
      CREDENCIAL_MOCK_A,
      ID_ELECCION_A
    )
    const actualNullifierCredencialB = calcularNullifier(
      CREDENCIAL_MOCK_B,
      ID_ELECCION_A
    )

    expect(actualNullifierCredencialA).not.toBe(actualNullifierCredencialB)
  })

  it('produce un hash Keccak-256 de 256 bits con prefijo 0x', () => {
    const actualNullifier = calcularNullifier(CREDENCIAL_MOCK_A, ID_ELECCION_A)

    expect(actualNullifier).toMatch(/^0x[0-9a-f]{64}$/)
  })

  describe('UAT-03 (Credenciales inválidas): input vacío/mal formado → aborta con error', () => {
    it('lanza error si la credencial es un string vacío', () => {
      expect(() => calcularNullifier('', ID_ELECCION_A)).toThrow(
        CredencialNulificadorInvalidaError
      )
    })

    it('lanza error si la credencial contiene solo espacios', () => {
      expect(() => calcularNullifier('   ', ID_ELECCION_A)).toThrow(
        CredencialNulificadorInvalidaError
      )
    })

    it('lanza error si la credencial no es un string', () => {
      // @ts-expect-error - input inválido intencional para el test
      expect(() => calcularNullifier(null, ID_ELECCION_A)).toThrow(
        CredencialNulificadorInvalidaError
      )
      // @ts-expect-error - input inválido intencional para el test
      expect(() => calcularNullifier(undefined, ID_ELECCION_A)).toThrow(
        CredencialNulificadorInvalidaError
      )
      // @ts-expect-error - input inválido intencional para el test
      expect(() => calcularNullifier(12345, ID_ELECCION_A)).toThrow(
        CredencialNulificadorInvalidaError
      )
    })

    it('lanza error si idEleccion no es un entero positivo', () => {
      expect(() => calcularNullifier(CREDENCIAL_MOCK_A, 0)).toThrow(
        CredencialNulificadorInvalidaError
      )
      expect(() => calcularNullifier(CREDENCIAL_MOCK_A, -1)).toThrow(
        CredencialNulificadorInvalidaError
      )
      expect(() => calcularNullifier(CREDENCIAL_MOCK_A, 1.5)).toThrow(
        CredencialNulificadorInvalidaError
      )
      // @ts-expect-error - input inválido intencional para el test
      expect(() => calcularNullifier(CREDENCIAL_MOCK_A, 'abc')).toThrow(
        CredencialNulificadorInvalidaError
      )
    })
  })
})
