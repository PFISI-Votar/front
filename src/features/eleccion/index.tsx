import { OfertaElectoralPanel } from './components/oferta-electoral-panel'

type OfertaElectoralPageProps = {
  idEleccion: number
}

export const OfertaElectoralPage = ({ idEleccion }: OfertaElectoralPageProps) => {
  return <OfertaElectoralPanel idEleccion={idEleccion} />
}

export { CreateComicioForm } from './components/create-comicio-form'
export { ListaDetailPanel } from './components/lista-detail-panel'
