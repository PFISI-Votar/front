const HTML_TAG = /<\/?[^>]*>/g

/**
 * User-authored strings (nombres, descripciones, listas) must be rendered as
 * text. Strip tags so a stored payload cannot become markup if a caller later
 * interpolates the value into HTML.
 */
export const toUntrustedPlainText = (value: string): string =>
  value.replace(HTML_TAG, '').replace(/[<>]/g, '')
