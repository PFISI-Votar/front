import { useRouterState } from '@tanstack/react-router'
import {
  BreadcrumbNav,
  type BreadcrumbEntry,
} from '@/components/layout/breadcrumb-nav'
import { useComiciosBreadcrumbEntries } from '@/components/layout/comicios-breadcrumbs'

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
  '/settings': { label: 'Settings' },
  '/settings/account': {
    parent: { label: 'Settings', href: '/settings' },
    label: 'Account',
  },
  '/settings/appearance': {
    parent: { label: 'Settings', href: '/settings' },
    label: 'Appearance',
  },
  '/settings/notifications': {
    parent: { label: 'Settings', href: '/settings' },
    label: 'Notifications',
  },
  '/settings/display': {
    parent: { label: 'Settings', href: '/settings' },
    label: 'Display',
  },
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

export const AppBreadcrumbs = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname.startsWith('/comicios')) {
    return <ComiciosBreadcrumbsNav />
  }

  return <StaticBreadcrumbsNav pathname={pathname} />
}
