import { keccak256 } from 'js-sha3'
import { bytesToHex, type Hex } from 'viem'

/**
 * VOTAR-377 — credencial de validación anónima (esquema commit/reveal).
 *
 * El secreto de 32 bytes se genera con Web Crypto API y vive SÓLO en el RAM del
 * navegador: nunca en localStorage, sessionStorage ni cookies (a diferencia del
 * seed de la billetera efímera). Tras canjearlo por la firma institucional se
 * llama a `zeroize()`, que borra el buffer y suelta la referencia al hex.
 */
export type ValidationCredential = {
  /** Secreto en claro (0x + 64 hex). Sólo se revela en la FASE 2 anónima. */
  readonly secreto: Hex
  /** keccak256(secreto) — lo único que se envía en la FASE 1 autenticada. */
  readonly commit: Hex
  /** Borra el buffer del secreto y suelta la referencia hex. Idempotente. */
  zeroize: () => void
}

export const createValidationCredential = (): ValidationCredential => {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.getRandomValues !== 'function'
  ) {
    throw new Error(
      'Web Crypto API no disponible: no se puede generar la credencial de validación'
    )
  }

  const secretoBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(secretoBytes)

  let secretoHex: Hex | null = bytesToHex(secretoBytes)
  const commit: Hex = `0x${keccak256(secretoBytes)}`

  let zeroized = false

  return {
    get secreto(): Hex {
      if (secretoHex === null) {
        throw new Error('Credencial de validación ya fue zeroizada')
      }
      return secretoHex
    },
    commit,
    zeroize: () => {
      if (zeroized) return
      secretoBytes.fill(0)
      secretoHex = null
      zeroized = true
    },
  }
}
