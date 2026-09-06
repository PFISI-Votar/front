import {
  type BreadcrumbEntry,
  type BreadcrumbMenuItem,
} from '@/components/layout/breadcrumb-nav'

const CONFIGURACION_SECTION_ITEMS: BreadcrumbMenuItem[] = [
  {
    label: 'Configuración institucional',
    to: '/configuracion',
  },
  {
    label: 'Seguridad',
    to: '/configuracion/seguridad',
  },
]

export const buildConfiguracionBreadcrumbEntries = (
  pathname: string
): BreadcrumbEntry[] => {
  const isSeguridad = pathname.includes('/seguridad')
  const activeTo = isSeguridad ? '/configuracion/seguridad' : '/configuracion'
  const sectionLabel = isSeguridad ? 'Seguridad' : 'Configuración institucional'

  return [
    {
      label: 'Configuración',
      to: '/configuracion',
    },
    {
      label: sectionLabel,
      menuItems: CONFIGURACION_SECTION_ITEMS,
      activeTo,
    },
  ]
}
