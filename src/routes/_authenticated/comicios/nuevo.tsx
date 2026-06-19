import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CreateComicioForm } from '@/features/eleccion'
import { ContentSection } from '@/features/settings/components/content-section'

export const Route = createFileRoute('/_authenticated/comicios/nuevo')({
  component: NuevoComicioPage,
})

function NuevoComicioPage() {
  const navigate = useNavigate()

  const handleCreated = (idEleccion: number) => {
    navigate({
      to: '/comicios/$idEleccion/oferta',
      params: { idEleccion: String(idEleccion) },
    })
  }

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Nuevo comicio
        </h1>
        <p className='text-muted-foreground'>
          Cree un comicio en estado BORRADOR para gestionar listas y candidatos
          antes de la oficialización.
        </p>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <ContentSection
          title='Datos del comicio'
          desc='Complete la información básica y las fechas de apertura y cierre.'
        >
          <CreateComicioForm onCreated={handleCreated} />
        </ContentSection>
      </div>
    </>
  )
}
