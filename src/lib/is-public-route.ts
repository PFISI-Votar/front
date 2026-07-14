/**
 * Rutas de acceso anónimo (auditor/observador y votante BUD).
 * Un 401 en estas rutas no debe forzar redirect al login (VOTAR-315).
 */
export const isPublicRoute = (pathname: string): boolean =>
  /\/comicios\/\d+\/(votar|dashboard)(\/|$)/.test(pathname) ||
  /\/verificar(\/|$)/.test(pathname)
