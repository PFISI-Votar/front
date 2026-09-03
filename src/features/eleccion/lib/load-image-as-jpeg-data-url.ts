/**
 * VOTAR-466 — el backend re-codifica y optimiza las imágenes electorales a
 * WebP al guardarlas, pero jsPDF (usado por las Actas de Apertura y Cierre)
 * solo acepta JPEG o PNG en `doc.addImage`. Este helper decodifica la
 * imagen con el decoder nativo del navegador (soporta WebP) y la
 * reexporta como JPEG vía canvas, que sí entiende jsPDF.
 *
 * Reemplaza el `loadImageAsDataUrl` que antes estaba duplicado en
 * `generar-acta-apertura-pdf.ts` y `generar-acta-cierre-pdf.ts` (ambos
 * simplemente re-envolvían el blob tal cual, lo cual funcionaba porque el
 * backend servía JPEG — dejó de ser válido con VOTAR-466).
 *
 * Carga best-effort: nunca bloquea la descarga del Acta. Si falla (logo no
 * configurado, red caída, formato no decodificable), resuelve a `null` y el
 * PDF continúa sin logo.
 */
export const loadImageAsJpegDataUrl = async (
  url: string
): Promise<string | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return null
    }
    // El logo puede traer transparencia (PNG/WebP); JPEG no soporta alfa.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    return canvas.toDataURL('image/jpeg', 0.92)
  } catch {
    return null
  }
}
