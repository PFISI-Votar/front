import { RefreshCw, Users, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type RevotoStatsCardsProps = {
  totalRevotes: number
  uniqueVoters: number
  overwriteRatio: number
  className?: string
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof Vote
  title: string
  value: string
  description: string
}) => (
  <Card className='gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'>
    <CardHeader className='space-y-2 px-5 pt-5 pb-2 sm:px-6'>
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
    <CardContent className='px-5 pb-5 sm:px-6'>
      <p className='text-3xl font-bold tracking-tight text-[#202124]'>
        {value}
      </p>
      <p className='mt-1 text-xs text-[#80868b]'>{description}</p>
    </CardContent>
  </Card>
)

export const RevotoStatsCards = ({
  totalRevotes,
  uniqueVoters,
  overwriteRatio,
  className,
}: RevotoStatsCardsProps) => (
  <div
    className={cn('grid gap-4 sm:grid-cols-3', className)}
    role='group'
    aria-label='Indicadores de re-voto'
  >
    <StatCard
      icon={RefreshCw}
      title='Re-votos totales'
      value={totalRevotes.toLocaleString('es-AR')}
      description='Acciones de sobreescritura registradas on-chain'
    />
    <StatCard
      icon={Users}
      title='Votantes únicos'
      value={uniqueVoters.toLocaleString('es-AR')}
      description='Votantes únicos con al menos un sufragio'
    />
    <StatCard
      icon={Vote}
      title='Tasa de sobreescritura'
      value={overwriteRatio.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      description='Proporción de re-votos sobre el total de eventos'
    />
  </div>
)
