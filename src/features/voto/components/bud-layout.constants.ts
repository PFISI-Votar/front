/** Contenedor principal del wizard */
export const BUD_SHELL_SECTION_CLASS =
  'relative mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8'

/**
 * Grid de listas completas (VOTAR-465).
 * VOTAR-464: gap reducido (antes gap-4) para que entren más listas en
 * pantalla sin scrollear, sobre todo en comicios con muchos participantes.
 * `items-start` (no `items-stretch`): cada card mide su propio contenido —
 * si no, expandir "Ver resto de candidatos" en una card estiraba a la misma
 * altura a las demás cards de esa fila, dejándolas con un hueco vacío entre
 * su contenido y el toggle (pegado abajo con `mt-auto`).
 */
export const BUD_LIST_GRID_CLASS =
  'grid grid-cols-1 items-start gap-2 md:grid-cols-2 xl:grid-cols-3'

/**
 * Grid de candidatos dentro de un rol.
 * auto-fit/minmax en vez de breakpoints de viewport (sm/lg/xl): esta grilla
 * vive adentro de la card de cada partido, cuyo ancho ya lo define el grid
 * auto-fit de partidos — con columnas fijas por viewport, un candidato único
 * quedaba comprimido a 1/3 del ancho de una card angosta y su nombre se
 * truncaba (p. ej. "Presidente Lista A" → "Presid...").
 */
export const BUD_CANDIDATE_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-3'

/** Botón primario sticky del paso selección */
export const BUD_STICKY_CTA_CLASS =
  'sticky bottom-4 z-10 flex w-full justify-stretch sm:justify-end'
