import { Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTotalVotantesPublico } from '@/features/padron/hooks/use-padron'

interface TotalVotantesCardProps {
  idEleccion: number
}

export function TotalVotantesCard({ idEleccion }: TotalVotantesCardProps) {
  const { data, isLoading, isError } = useTotalVotantesPublico(idEleccion)

  if (isLoading) {
    return (
      <p className='text-muted-foreground text-sm' aria-live='polite'>
        Cargando total de votantes…
      </p>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Users className='size-5' />
            Padrón aún no consolidado
          </CardTitle>
          <CardDescription>
            El total de votantes habilitados estará disponible una vez que el
            padrón sea publicado.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Users className='size-5' />
          Votantes habilitados
        </CardTitle>
        <CardDescription>
          Total consolidado del padrón electoral
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-3xl font-bold'>
          {data.totalVotantesHabilitados.toLocaleString('es-AR')}
        </p>
      </CardContent>
    </Card>
  )
}