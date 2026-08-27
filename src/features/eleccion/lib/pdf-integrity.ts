/**
 * Hash SHA-256 (hex) de los bytes de un PDF, calculado con Web Crypto API
 * (mismo mecanismo criptográfico ya usado para la billetera efímera del
 * proyecto). Se usa para registrar la integridad del Acta de Cierre en el
 * audit log antes de descargarla — ver `use-generar-acta-cierre.ts`.
 */
export const hashPdfBytesSha256 = async (
  bytes: ArrayBuffer
): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
