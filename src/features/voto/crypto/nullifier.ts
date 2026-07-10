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
 * (El separador `:` es un detalle de implementación para evitar
 * ambigüedad de concatenación entre credenciales de largo variable y el
 * id de elección; no altera el diseño conceptual
 * `hash(credencial + idEleccion)` documentado en `CLAUDE.md` y
 * `lineamientos-desarrollo.md` §7.3.)
 *
 * **Alcance de esta implementación**: la credencial es un parámetro
 * genérico, deliberadamente desacoplado de su fuente real. Según la
 * arquitectura documentada (lineamientos-desarrollo.md`),
 * la credencial de referencia es la **clave pública de la billetera
 * efímera** (`clavePublica`) — no `votanteHash` del padrón, que sería
 * recomputable por cualquiera con acceso al padrón (dni+email) y
 * rompería la desvinculación identidad↔voto exigida por VOTAR-379.
 *
 * Esta función todavía NO está integrada al flujo real de la BUD: la
 * billetera efímera (VOTAR-352) ya está mergeada en `dev`
 * (`features/voto/crypto/ephemeral-wallet.ts`), pero la conexión en
 * `bud-voting-wizard.tsx` (llamar a esta función en `handleSignVote`
 * con la clave pública real) queda para un commit/PR de integración
 * separado, para no mezclar en un mismo cambio el motor de cálculo con
 * su punto de uso.
 *
 * Irreversibilidad (criterio de aceptación): esta función corre
 * exclusivamente en cliente y Keccak-256 no tiene operación inversa
 * conocida — no existe camino de vuelta de nulificador a credencial.
 *
 * Persistencia: el valor retornado debe vivir solo en memoria volátil
 * (closure/estado en RAM). Nunca debe escribirse en localStorage,
 * sessionStorage ni cookies (VOTAR-353, criterio de aceptación /
 * VOTAR-379 UAT-03). Esta función no persiste nada por sí misma; la
 * responsabilidad de no persistir el resultado es del código que la
 * invoque.
 *
 * @param credencial Identificador anónimo estable asociado al votante
 *   para esta elección (referencia: clave pública de la billetera
 *   efímera, en formato string, ej. hex).
 * @param idEleccion Identificador numérico entero positivo de la elección.
 * @returns Nulificador de 256 bits en formato hex con prefijo `0x`
 *   (66 caracteres en total).
 * @throws {CredencialNulificadorInvalidaError} si `credencial` es vacía,
 *   solo espacios, o no es un string; o si `idEleccion` no es un entero
 *   positivo.
 */

export const calcularNullifier = (
  credencial: string,
  idEleccion: number
): string => {
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
