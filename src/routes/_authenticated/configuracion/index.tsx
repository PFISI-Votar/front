import { createFileRoute } from '@tanstack/react-router'
import { ConfiguracionSistemaPage } from '@/features/configuracion-sistema/components/configuracion-sistema-page'

export const Route = createFileRoute('/_authenticated/configuracion/')({
  component: ConfiguracionSistemaPage,
})
