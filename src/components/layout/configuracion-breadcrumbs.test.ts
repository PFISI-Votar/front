import { describe, expect, it } from 'vitest'
import { buildConfiguracionBreadcrumbEntries } from '@/components/layout/configuracion-breadcrumbs'

describe('buildConfiguracionBreadcrumbEntries', () => {
  it('builds institucional section with switcher on /configuracion', () => {
    expect(buildConfiguracionBreadcrumbEntries('/configuracion')).toEqual([
      { label: 'Configuración', to: '/configuracion' },
      {
        label: 'Configuración institucional',
        menuItems: [
          { label: 'Configuración institucional', to: '/configuracion' },
          { label: 'Seguridad', to: '/configuracion/seguridad' },
        ],
        activeTo: '/configuracion',
      },
    ])
  })

  it('builds seguridad section with switcher on /configuracion/seguridad', () => {
    expect(
      buildConfiguracionBreadcrumbEntries('/configuracion/seguridad')
    ).toEqual([
      { label: 'Configuración', to: '/configuracion' },
      {
        label: 'Seguridad',
        menuItems: [
          { label: 'Configuración institucional', to: '/configuracion' },
          { label: 'Seguridad', to: '/configuracion/seguridad' },
        ],
        activeTo: '/configuracion/seguridad',
      },
    ])
  })
})
