import { createFileRoute } from '@tanstack/react-router'
import { ListaDetailPanel } from '@/features/eleccion'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/listas/$idLista/'
)({
  component: ListaDetailRoute,
})

function ListaDetailRoute() {
  const { idEleccion, idLista } = Route.useParams()

  return (
    <ListaDetailPanel
      idEleccion={Number(idEleccion)}
      idLista={Number(idLista)}
    />
  )
}
