import { useQuery } from '@tanstack/react-query'
import { useParams, useRouterState } from '@tanstack/react-router'
import { type BreadcrumbEntry } from '@/components/layout/breadcrumb-nav'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'

type BuildComiciosBreadcrumbInput = {
  pathname: string
  idEleccion?: number
  idLista?: number
  eleccionNombre?: string
  listaNombre?: string
  listaSigla?: string
}

export const buildComiciosBreadcrumbEntries = ({
  pathname,
  idEleccion,
  idLista,
  eleccionNombre,
  listaNombre,
  listaSigla,
}: BuildComiciosBreadcrumbInput): BreadcrumbEntry[] => {
  const entries: BreadcrumbEntry[] = [
    { label: 'Comicios', to: '/comicios' },
  ]

  if (pathname.endsWith('/comicios/nuevo')) {
    entries.push({ label: 'Nuevo comicio' })
    return entries
  }

  if (idEleccion == null) {
    return entries
  }

  const idEleccionParam = String(idEleccion)
  const eleccionLabel = eleccionNombre ?? `Comicio #${idEleccion}`
  const ofertaLink: BreadcrumbEntry = {
    label: eleccionLabel,
    to: '/comicios/$idEleccion/oferta',
    params: { idEleccion: idEleccionParam },
  }

  if (pathname.endsWith('/editar')) {
    entries.push(ofertaLink, { label: 'Editar comicio' })
    return entries
  }

  if (pathname.includes('/padron/preview')) {
    entries.push(
      ofertaLink,
      {
        label: 'Padrón electoral',
        to: '/comicios/$idEleccion/padron',
        params: { idEleccion: idEleccionParam },
      },
      { label: 'Previsualizar padrón' }
    )
    return entries
  }

  if (pathname.includes('/padron')) {
    entries.push(ofertaLink, { label: 'Padrón electoral' })
    return entries
  }

  if (pathname.includes('/oferta')) {
    entries.push(ofertaLink, { label: 'Oferta electoral' })
    return entries
  }

  if (idLista != null) {
    const listaLabel =
      listaNombre && listaSigla
        ? `${listaNombre} (${listaSigla})`
        : `Lista #${idLista}`

    entries.push(
      ofertaLink,
      {
        label: 'Oferta electoral',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: idEleccionParam },
      },
      { label: listaLabel }
    )
    return entries
  }

  entries.push(ofertaLink)
  return entries
}

export const useComiciosBreadcrumbEntries = (): BreadcrumbEntry[] => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const params = useParams({ strict: false })

  const idEleccion = params.idEleccion ? Number(params.idEleccion) : undefined
  const idLista = params.idLista ? Number(params.idLista) : undefined

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

  return buildComiciosBreadcrumbEntries({
    pathname,
    idEleccion,
    idLista,
    eleccionNombre: eleccionQuery.data?.nombre,
    listaNombre: lista?.nombre,
    listaSigla: lista?.sigla,
  })
}
