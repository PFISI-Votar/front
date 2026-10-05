import { useDashboardPublicoComicio } from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import type { VisibilidadDashboardPublico } from '@/features/voto/data/schema'

/**
 * VOTAR-459: resuelve si una solapa configurable del dashboard público está
 * visible. Reutiliza la misma query que ya usan las 8 páginas del dashboard
 * (`use-dashboard-publico-comicio`), así que no dispara un fetch adicional.
 *
 * Devuelve `undefined` mientras el comicio todavía no cargó — los llamadores
 * deben tratarlo como "aún no se sabe" (no ocultar de entrada, no habilitar
 * la query de datos todavía).
 */
export const useSeccionDashboardVisible = (
  idEleccion: number,
  seccion: keyof VisibilidadDashboardPublico
): boolean | undefined => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  return comicioQuery.data?.visibilidadDashboard?.[seccion]
}
