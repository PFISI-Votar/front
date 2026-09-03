import { useQuery } from '@tanstack/react-query'
import { useParams, useRouterState } from '@tanstack/react-router'
import {
  type BreadcrumbEntry,
  type BreadcrumbMenuItem,
} from '@/components/layout/breadcrumb-nav'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'

const buildComicioSectionMenuItems = (
  idEleccionParam: string
): BreadcrumbMenuItem[] => [
  {
    label: 'Oferta electoral',
    to: '/comicios/$idEleccion/oferta',
    params: { idEleccion: idEleccionParam },
  },
  {
    label: 'Padrón electoral',
    to: '/comicios/$idEleccion/padron',
    params: { idEleccion: idEleccionParam },
  },
  {
    label: 'Registro de auditoría',
    to: '/comicios/$idEleccion/auditoria',
    params: { idEleccion: idEleccionParam },
  },
]

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
  const entries: BreadcrumbEntry[] = [{ label: 'Comicios', to: '/comicios' }]

  if (pathname.endsWith('/comicios/nuevo')) {
    entries.push({ label: 'Nuevo comicio' })
    return entries
  }

  if (idEleccion == null) {
    return entries
  }

  const idEleccionParam = String(idEleccion)
  const eleccionLabel = eleccionNombre ?? `Comicio #${idEleccion}`
  const sectionMenuItems = buildComicioSectionMenuItems(idEleccionParam)
  const activeSectionTo = pathname.includes('/auditoria')
    ? '/comicios/$idEleccion/auditoria'
    : pathname.includes('/padron')
      ? '/comicios/$idEleccion/padron'
      : '/comicios/$idEleccion/oferta'
  const comicioSection: BreadcrumbEntry = {
    label: eleccionLabel,
    to: '/comicios/$idEleccion/oferta',
    params: { idEleccion: idEleccionParam },
    menuItems: sectionMenuItems,
    activeTo: activeSectionTo,
  }

  if (pathname.endsWith('/editar')) {
    entries.push(comicioSection, { label: 'Editar comicio' })
    return entries
  }

  if (pathname.includes('/auditoria')) {
    entries.push(comicioSection)
    return entries
  }

  if (pathname.includes('/padron/preview')) {
    entries.push(comicioSection, { label: 'Previsualizar padrón' })
    return entries
  }

  if (pathname.includes('/padron')) {
    entries.push(comicioSection)
    return entries
  }

  if (pathname.includes('/oferta')) {
    entries.push(comicioSection)
    return entries
  }

  if (idLista != null) {
    const listaLabel =
      listaNombre && listaSigla
        ? `${listaNombre} (${listaSigla})`
        : `Lista #${idLista}`

    const comicioSectionSinMenu: BreadcrumbEntry = {
      label: comicioSection.label,
      to: comicioSection.to,
      params: comicioSection.params,
    }

    entries.push(comicioSectionSinMenu, { label: listaLabel })
    return entries
  }

  entries.push(comicioSection)
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
