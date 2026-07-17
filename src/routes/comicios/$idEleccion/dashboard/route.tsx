import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/comicios/$idEleccion/dashboard')({
  component: DashboardPublicoLayoutRoute,
})

function DashboardPublicoLayoutRoute() {
  return <Outlet />
}
