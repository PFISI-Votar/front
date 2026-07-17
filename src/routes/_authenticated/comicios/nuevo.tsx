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

  const handleCancel = () => {
    navigate({ to: '/comicios' })
  }

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Nuevo comicio
        </h1>
        <p className='text-muted-foreground'>
          Configure el comicio en estado BORRADOR. Luego defina las categorías
          electorales en la oferta electoral.
        </p>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <ContentSection
          title='Configuración inicial'
          desc='Complete todos los campos obligatorios. El comicio se guardará en borrador sin impactar la blockchain.'
          contentWidth='wide'
        >
          <CreateComicioForm
            onCreated={handleCreated}
            onCancel={handleCancel}
          />
        </ContentSection>
      </div>
    </>
  )
}
