import { useRouterState } from '@tanstack/react-router'
import {
  BreadcrumbNav,
  type BreadcrumbEntry,
} from '@/components/layout/breadcrumb-nav'
import { useComiciosBreadcrumbEntries } from '@/components/layout/comicios-breadcrumbs'
import { buildConfiguracionBreadcrumbEntries } from '@/components/layout/configuracion-breadcrumbs'

type StaticRouteConfig = {
  label: string
  parent?: {
    label: string
    href: string
  }
}

const STATIC_ROUTE_BREADCRUMBS: Record<string, StaticRouteConfig> = {
  '/users': { label: 'Users' },
  '/tasks': { label: 'Tasks' },
  '/apps': { label: 'Apps' },
  '/chats': { label: 'Chats' },
  '/help-center': { label: 'Help Center' },
  '/auditoria': { label: 'Auditoría' },
  '/errors/unauthorized': {
    parent: { label: 'Errores', href: '/errors/unauthorized' },
    label: 'No autorizado',
  },
  '/errors/forbidden': {
    parent: { label: 'Errores', href: '/errors/forbidden' },
    label: 'Acceso denegado',
  },
  '/errors/not-found': {
    parent: { label: 'Errores', href: '/errors/not-found' },
    label: 'No encontrada',
  },
  '/errors/internal-server-error': {
    parent: { label: 'Errores', href: '/errors/internal-server-error' },
    label: 'Error interno del servidor',
  },
  '/errors/maintenance-error': {
    parent: { label: 'Errores', href: '/errors/maintenance-error' },
    label: 'Mantenimiento',
  },
}

const getStaticBreadcrumbEntries = (pathname: string): BreadcrumbEntry[] => {
  const config = STATIC_ROUTE_BREADCRUMBS[pathname]

  if (!config) {
    return []
  }

  if (config.parent) {
    return [
      { label: config.parent.label, to: config.parent.href },
      { label: config.label },
    ]
  }

  return [{ label: config.label }]
}

const ComiciosBreadcrumbsNav = () => {
  const entries = useComiciosBreadcrumbEntries()
  return <BreadcrumbNav entries={entries} />
}

const StaticBreadcrumbsNav = ({ pathname }: { pathname: string }) => {
  const entries = getStaticBreadcrumbEntries(pathname)
  return <BreadcrumbNav entries={entries} />
}

const ConfiguracionBreadcrumbsNav = ({ pathname }: { pathname: string }) => {
  const entries = buildConfiguracionBreadcrumbEntries(pathname)
  return <BreadcrumbNav entries={entries} />
}

export const AppBreadcrumbs = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname.startsWith('/comicios')) {
    return <ComiciosBreadcrumbsNav />
  }

  if (pathname.startsWith('/configuracion')) {
    return <ConfiguracionBreadcrumbsNav pathname={pathname} />
  }

  return <StaticBreadcrumbsNav pathname={pathname} />
}
