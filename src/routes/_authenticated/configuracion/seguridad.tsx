import { createFileRoute } from '@tanstack/react-router'
import { SeguridadPage } from '@/features/configuracion-sistema/components/seguridad-page'

export const Route = createFileRoute('/_authenticated/configuracion/seguridad')(
  {
    component: SeguridadPage,
  }
)
