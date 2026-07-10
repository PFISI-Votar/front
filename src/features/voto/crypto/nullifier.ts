import { keccak256 } from 'js-sha3'

/**
 * Se lanza cuando la credencial o el idEleccion provistos al motor de
 * cálculo del nulificador no son válidos (vacíos, mal formados, o de
 * tipo incorrecto). Ver VOTAR-353, UAT-03.
 */
export class CredencialNulificadorInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'CredencialNulificadorInvalidaError'
  }
}

const esCredencialValida = (credencial: unknown): credencial is string =>
  typeof credencial === 'string' && credencial.trim().length > 0

const esIdEleccionValido = (idEleccion: unknown): idEleccion is number =>
  typeof idEleccion === 'number' &&
  Number.isInteger(idEleccion) &&
  idEleccion > 0

/**
 * Calcula el nulificador anónimo y determinístico de un votante para una
 * elección puntual, usado para prevenir el doble sufragio sin revelar la
 * identidad real del elector (VOTAR-353).
 *
 * Fórmula: `Nullifier = Keccak256(credencial + ":" + idEleccion)`
 *
 * El separador `:` evita ambigüedad de concatenación entre credenciales de
 * largo variable y el id de elección; no altera el diseño conceptual
 * `hash(clavePublica + idEleccion)` de `lineamientos-desarrollo.md` §7.3
 * y `contexto-sistema.md`.
 *
 * La credencial de referencia es la **clave pública de la billetera
 * efímera** (`clavePublica`), no `votanteHash` del padrón (recomputable
 * desde dni+email y rompería la desvinculación identidad↔voto de
 * VOTAR-379).
 *
 * Corre exclusivamente en cliente. El valor retornado debe vivir solo en
 * memoria volátil; nunca en localStorage, sessionStorage ni cookies.
 *
 * @param credencial Clave pública de la billetera efímera (string hex).
 * @param idEleccion Identificador numérico entero positivo de la elección.
 * @returns Nulificador de 256 bits en formato hex con prefijo `0x`.
 * @throws {CredencialNulificadorInvalidaError} si los inputs son inválidos.
 */
export const calcularNullifier = (
  credencial: string,
  idEleccion: number
): `0x${string}` => {
  if (!esCredencialValida(credencial)) {
    throw new CredencialNulificadorInvalidaError(
      'La credencial provista para calcular el nulificador es inválida o está vacía.'
    )
  }

  if (!esIdEleccionValido(idEleccion)) {
    throw new CredencialNulificadorInvalidaError(
      'El idEleccion provisto para calcular el nulificador es inválido.'
    )
  }

  const payload = `${credencial}:${idEleccion}`
  return `0x${keccak256(payload)}`
}
