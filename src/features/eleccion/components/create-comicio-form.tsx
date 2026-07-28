import { toast } from 'sonner'
import { crearEleccion } from '@/features/eleccion/api/eleccion-api'
import { ComicioForm } from '@/features/eleccion/components/comicio-form'
import type { CreateComicioInput } from '@/features/eleccion/data/schema'

type CreateComicioFormProps = {
  onCreated: (idEleccion: number) => void
  onCancel: () => void
}

export const CreateComicioForm = ({
  onCreated,
  onCancel,
}: CreateComicioFormProps) => {
  const handleSubmit = async (values: CreateComicioInput) => {
    const eleccion = await crearEleccion(values)
    toast.success(
      `Comicio creado (ID ${eleccion.idEleccion}, estado ${eleccion.estado})`
    )
    onCreated(eleccion.idEleccion)
  }

  return (
    <ComicioForm
      mode='create'
      submitLabel='Crear comicio'
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  )
}
