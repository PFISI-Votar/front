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

type BreadcrumbListaOption = {
  idLista: number
  nombre: string
  sigla: string
}

type BuildComiciosBreadcrumbInput = {
  pathname: string
  idEleccion?: number
  idLista?: number
  eleccionNombre?: string
  listaNombre?: string
  listaSigla?: string
  /**
   * Listas del comicio para el selector del breadcrumb en la vista de detalle
   * de lista (VOTAR-480). Con 2+ listas el paso de lista pasa a ser un menú
   * navegable; con 0/1 queda como texto plano.
   */
  listas?: BreadcrumbListaOption[]
}

export const buildComiciosBreadcrumbEntries = ({
  pathname,
  idEleccion,
  idLista,
  eleccionNombre,
  listaNombre,
  listaSigla,
  listas,
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

    const listaEntry: BreadcrumbEntry = { label: listaLabel }
    if (listas && listas.length > 1) {
      listaEntry.menuAriaLabel = 'Cambiar de lista'
      listaEntry.menuItems = listas.map((item) => ({
        label: `${item.nombre} (${item.sigla})`,
        to: '/comicios/$idEleccion/listas/$idLista',
        params: { idEleccion: idEleccionParam, idLista: String(item.idLista) },
        current: item.idLista === idLista,
      }))
    }

    entries.push(comicioSectionSinMenu, listaEntry)
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
    listas: listasQuery.data?.map((item) => ({
      idLista: item.idLista,
      nombre: item.nombre,
      sigla: item.sigla,
    })),
  })
}
