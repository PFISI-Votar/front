/**
 * Motor genérico de interpolación `{{token}}` compartido por todas las
 * actas oficiales (Apertura, Cierre, futuras). No conoce nada específico
 * de un documento — cada acta define su propio registro de variables y
 * view model, y usa `interpolarPlantilla` para renderizarlas.
 */

export const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g

/**
 * Interpola `{{token}}` en `template` usando `viewModel`. Un token no
 * reconocido se deja literal — así el admin nota un typo en el preview en
 * vez de perder el dato silenciosamente.
 */
export const interpolarPlantilla = (
  template: string,
  viewModel: Record<string, string>
): string =>
  template.replace(TOKEN_PATTERN, (match, token: string) =>
    token in viewModel ? viewModel[token] : match
  )
