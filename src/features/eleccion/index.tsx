import { OfertaElectoralPanel } from '@/features/eleccion/lista/components/oferta-electoral-panel'

type OfertaElectoralPageProps = {
  idEleccion: number
}

export const OfertaElectoralPage = ({
  idEleccion,
}: OfertaElectoralPageProps) => {
  return <OfertaElectoralPanel idEleccion={idEleccion} />
}

export { CreateComicioForm } from '@/features/eleccion/components/create-comicio-form'
export { ListaDetailPanel } from '@/features/eleccion/lista/components/lista-detail-panel'
