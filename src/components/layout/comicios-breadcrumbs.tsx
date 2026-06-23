import { useParams, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'
import { type BreadcrumbEntry } from '@/components/layout/breadcrumb-nav'

export const useComiciosBreadcrumbEntries = (): BreadcrumbEntry[] => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const params = useParams({ strict: false })

  const idEleccion = params.idEleccion ? Number(params.idEleccion) : undefined
  const idLista = params.idLista ? Number(params.idLista) : undefined

  const isNuevoComicio = pathname.endsWith('/comicios/nuevo')
  const isEditarComicio = pathname.endsWith('/editar')
  const isOferta = pathname.includes('/oferta')

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccion],
    queryFn: () => obtenerEleccion(idEleccion!),
    enabled: idEleccion != null,
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccion],
    queryFn: () => listarListas(idEleccion!),
    enabled: idEleccion != null && idLista != null,
  })

  const lista = listasQuery.data?.find((item) => item.idLista === idLista)

  const eleccionLabel =
    eleccionQuery.data?.nombre ??
    (idEleccion != null ? `Comicio #${idEleccion}` : 'Comicio')

  const listaLabel = lista
    ? `${lista.nombre} (${lista.sigla})`
    : idLista != null
      ? `Lista #${idLista}`
      : 'Lista'

  const entries: BreadcrumbEntry[] = [{ label: 'Comicios', href: '/comicios' }]

  if (isNuevoComicio) {
    entries.push({ label: 'Nuevo comicio' })
    return entries
  }

  if (idEleccion == null) {
    return entries
  }

  entries.push({
    label: eleccionLabel,
    href: `/comicios/${idEleccion}/oferta`,
  })

  if (isEditarComicio) {
    entries.push({ label: 'Editar comicio' })
    return entries
  }

  if (isOferta) {
    entries.push({ label: 'Oferta electoral' })
    return entries
  }

  if (idLista == null) {
    return entries
  }

  entries.push({
    label: listaLabel,
  })

  return entries
}
