import { FileWarning, Percent, Users, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ParticipacionEscrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'

type ParticipacionStatsCardsProps = {
  participacion: ParticipacionEscrutinio
  className?: string
  compact?: boolean
  /** VOTAR-447: blank votes always shown; null votes only when enabled. */
  permitirVotoNulo?: boolean
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  description,
  compact,
}: {
  icon: typeof Vote
  title: string
  value: string
  description: string
  compact?: boolean
}) => (
  <Card
    className={cn(
      'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
      compact && 'shadow-none'
    )}
  >
    <CardHeader
      className={cn(
        'space-y-2 px-5 pt-5 pb-2 sm:px-6',
        compact && 'px-4 pt-4 pb-1'
      )}
    >
      <div
        className='flex size-10 items-center justify-center rounded-xl bg-[#2f6f9f]/10 text-[#2f6f9f]'
        aria-hidden='true'
      >
        <Icon className='size-5' />
      </div>
      <CardTitle className='text-sm font-semibold text-[#5f6368]'>
        {title}
      </CardTitle>
      <CardDescription className='sr-only'>{description}</CardDescription>
    </CardHeader>
    <CardContent className={cn('px-5 pb-5 sm:px-6', compact && 'px-4 pb-4')}>
      <p className='text-3xl font-bold tracking-tight text-[#202124]'>
        {value}
      </p>
      <p className='mt-1 text-xs text-[#80868b]'>{description}</p>
    </CardContent>
  </Card>
)

export const ParticipacionStatsCards = ({
  participacion,
  className,
  compact = false,
  permitirVotoNulo = true,
}: ParticipacionStatsCardsProps) => (
  <div
    className={cn(
      'grid gap-4 sm:grid-cols-2',
      permitirVotoNulo ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
      className
    )}
    role='group'
    aria-label='Indicadores de participación'
  >
    <StatCard
      icon={Vote}
      title='Votos emitidos'
      value={participacion.totalVotos.toLocaleString('es-AR')}
      description='Sufragios únicos (último voto cuenta)'
      compact={compact}
    />
    <StatCard
      icon={Percent}
      title='Participación'
      value={`${participacion.porcentajeParticipacion.toLocaleString('es-AR')}%`}
      description={`Sobre ${participacion.totalVotantesHabilitados.toLocaleString('es-AR')} habilitados`}
      compact={compact}
    />
    <StatCard
      icon={Users}
      title='En blanco'
      value={participacion.votosBlanco.toLocaleString('es-AR')}
      description='Votos en blanco contabilizados'
      compact={compact}
    />
    {permitirVotoNulo && (
      <StatCard
        icon={FileWarning}
        title='Nulos'
        value={participacion.votosNulo.toLocaleString('es-AR')}
        description='Votos nulos contabilizados'
        compact={compact}
      />
    )}
  </div>
)
