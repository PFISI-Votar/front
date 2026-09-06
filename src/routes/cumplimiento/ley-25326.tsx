import { createFileRoute } from '@tanstack/react-router'
import { Ley25326Page } from '@/features/cumplimiento'

export const Route = createFileRoute('/cumplimiento/ley-25326')({
  component: CumplimientoLey25326Route,
})

function CumplimientoLey25326Route() {
  return <Ley25326Page />
}
