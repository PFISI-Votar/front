import { createFileRoute } from '@tanstack/react-router'
import { ComiciosLayout } from '@/features/eleccion/layout/comicios-layout'

export const Route = createFileRoute('/_authenticated/comicios')({
  component: ComiciosLayout,
})
