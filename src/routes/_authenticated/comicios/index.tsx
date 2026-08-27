import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComiciosList } from '@/features/eleccion/components/comicios-list'

export const Route = createFileRoute('/_authenticated/comicios/')({
  component: ComiciosIndexPage,
})

function ComiciosIndexPage() {
  return (
    <>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='flex flex-col gap-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Gestionar oferta
          </h1>
          <p className='text-muted-foreground'>
            Seleccione un comicio para administrar sus listas y candidatos.
          </p>
        </div>
        <Button asChild>
          <Link to='/comicios/nuevo'>
            <Plus className='me-2 size-4' />
            Nuevo comicio
          </Link>
        </Button>
      </div>
      <Tabs defaultValue='activos' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='activos'>Activos</TabsTrigger>
          <TabsTrigger value='historicos'>Históricos</TabsTrigger>
        </TabsList>
        <TabsContent value='activos'>
          <ComiciosList estado='activos' />
        </TabsContent>
        <TabsContent value='historicos'>
          <ComiciosList estado='historicos' />
        </TabsContent>
      </Tabs>
    </>
  )
}
