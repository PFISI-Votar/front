import { ShieldAlert, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTotalVotantesPublico } from '@/features/padron/hooks/use-padron'

type TotalVotantesCardProps = {
  idEleccion: number
  className?: string
}

export const TotalVotantesCard = ({
  idEleccion,
  className,
}: TotalVotantesCardProps) => {
  const { data, isLoading, isError } = useTotalVotantesPublico(idEleccion)

  if (isLoading) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
          className
        )}
        aria-busy='true'
        aria-live='polite'
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
          <Skeleton className='size-11 rounded-xl' />
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent className='px-6 pb-6 sm:px-8'>
          <Skeleton className='h-12 w-32' />
          <p className='sr-only'>Cargando total de votantes…</p>
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-amber-200/80 bg-amber-50/40 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.06)]',
          className
        )}
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-6 sm:px-8'>
          <div
            className='flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800'
            aria-hidden='true'
          >
            <ShieldAlert className='size-5' />
          </div>
          <div className='space-y-1.5'>
            <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
              Padrón aún no consolidado
            </CardTitle>
            <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
              El total de votantes habilitados estará disponible una vez que el
              padrón sea publicado por la autoridad electoral.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
        className
      )}
    >
      <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
        <div
          className='flex size-11 items-center justify-center rounded-xl bg-[#2f6f9f]/10 text-[#2f6f9f]'
          aria-hidden='true'
        >
          <Users className='size-5' />
        </div>
        <div className='space-y-1.5'>
          <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
            Total de votantes habilitados
          </CardTitle>
          <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
            Registros importados y consolidados del padrón electoral
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='px-6 pb-6 sm:px-8'>
        <p
          className='text-4xl font-extrabold tracking-tight text-[#2f6f9f] tabular-nums sm:text-5xl'
          aria-label={`${data.totalVotantesHabilitados.toLocaleString('es-AR')} votantes habilitados`}
        >
          {data.totalVotantesHabilitados.toLocaleString('es-AR')}
        </p>
      </CardContent>
    </Card>
  )
}
