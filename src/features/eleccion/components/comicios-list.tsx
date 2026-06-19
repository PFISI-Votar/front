import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Vote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDateTimeForDisplay } from '@/lib/datetime'
import { listarElecciones } from '../api/eleccion-api'
import type { EleccionEstado } from '../data/schema'

const estadoVariant = (estado: EleccionEstado) => {
  if (estado === 'BORRADOR') return 'secondary' as const
  if (estado === 'CONFIGURADA') return 'default' as const
  return 'outline' as const
}

export const ComiciosList = () => {
  const { data: comicios, isLoading, isError } = useQuery({
    queryKey: ['elecciones'],
    queryFn: listarElecciones,
  })

  if (isLoading) {
    return (
      <p className='text-muted-foreground text-sm' aria-live='polite'>
        Cargando comicios…
      </p>
    )
  }

  if (isError) {
    return (
      <p className='text-destructive text-sm' role='alert'>
        No se pudo cargar el listado de comicios. Verifique que el backend esté en
        ejecución.
      </p>
    )
  }

  if (!comicios?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Vote className='size-5' />
            Sin comicios registrados
          </CardTitle>
          <CardDescription>
            Cree un comicio en estado BORRADOR para comenzar a cargar listas y
            candidatos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to='/comicios/nuevo'>Crear comicio</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className='grid gap-4' aria-label='Listado de comicios'>
      {comicios.map((comicio) => (
        <li key={comicio.idEleccion}>
          <Card>
            <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
              <div className='space-y-1'>
                <CardTitle className='text-lg'>{comicio.nombre}</CardTitle>
                <CardDescription>
                  ID {comicio.idEleccion} · Apertura{' '}
                  {formatDateTimeForDisplay(comicio.fechaInicio)}
                </CardDescription>
              </div>
              <Badge variant={estadoVariant(comicio.estado)}>{comicio.estado}</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant='outline' size='sm'>
                <Link
                  to='/comicios/$idEleccion/oferta'
                  params={{ idEleccion: String(comicio.idEleccion) }}
                  aria-label={`Ver comicios`}
                >
                  Ver comicios
                  <ArrowRight className='ms-2 size-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
