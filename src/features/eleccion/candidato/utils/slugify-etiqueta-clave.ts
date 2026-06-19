export const slugifyEtiquetaToClave = (etiqueta: string): string =>
  etiqueta.trim().toLowerCase().replace(/\s+/g, '-')
