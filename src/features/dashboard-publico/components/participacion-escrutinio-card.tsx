import { Activity, Percent, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ParticipacionPublica } from '@/features/dashboard-publico/api/dashboard-publico-api'

type ParticipacionEscrutinioCardProps = {
  participacion?: ParticipacionPublica
  isLoading?: boolean
  isError?: boolean
  className?: string
}

export const ParticipacionEscrutinioCard = ({
  participacion,
  isLoading,
  isError,
  className,
}: ParticipacionEscrutinioCardProps) => {
  if (isLoading) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
          className
        )}
        aria-busy='true'
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
          <Skeleton className='size-11 rounded-xl' />
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent className='grid gap-4 px-6 pb-6 sm:grid-cols-3 sm:px-8'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </CardContent>
      </Card>
    )
  }

  if (isError || !participacion) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-amber-200/80 bg-amber-50/40 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.06)]',
          className
        )}
        role='alert'
      >
        <CardHeader className='space-y-2 px-6 py-6 sm:px-8'>
          <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
            Escrutinio no disponible
          </CardTitle>
          <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
            No se pudieron consultar los votos fiscalizados on-chain. Verifique
            que el nodo y AuditView estén configurados.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const metrics = [
    {
      icon: Users,
      label: 'Votos fiscalizados',
      value: participacion.votosFiscalizados.toLocaleString('es-AR'),
    },
    {
      icon: Percent,
      label: '% del escrutinio',
      value: `${participacion.porcentajeEscrutinio.toLocaleString('es-AR')}%`,
    },
    {
      icon: Activity,
      label: 'Padrón habilitado',
      value: participacion.totalVotantesHabilitados.toLocaleString('es-AR'),
    },
  ]

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
        className
      )}
    >
      <CardHeader className='space-y-2 px-6 pt-6 pb-2 sm:px-8'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Participación en tiempo real
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Votos únicos validados on-chain y avance del escrutinio sobre el
          padrón consolidado.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 px-6 pb-6 sm:grid-cols-3 sm:px-8'>
        {metrics.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className='rounded-xl border border-[#e8edf2] bg-[#f8fafc] px-4 py-3'
          >
            <div className='mb-2 flex items-center gap-2 text-[#2f6f9f]'>
              <Icon className='size-4' aria-hidden='true' />
              <p className='text-xs font-semibold tracking-wide uppercase'>
                {label}
              </p>
            </div>
            <p className='text-2xl font-extrabold tracking-tight text-[#202124] tabular-nums'>
              {value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
