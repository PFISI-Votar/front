import { Activity, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getEstadoEleccionBadgeClass,
  getEstadoEleccionLabel,
} from '@/features/dashboard-publico/lib/estado-eleccion'

type EstadoComicioCardProps = {
  estado: string
  isFrozen: boolean
  tipoVotacion?: string
  className?: string
}

export const EstadoComicioCard = ({
  estado,
  isFrozen,
  tipoVotacion,
  className,
}: EstadoComicioCardProps) => (
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
        {isFrozen ? (
          <Snowflake className='size-5' />
        ) : (
          <Activity className='size-5' />
        )}
      </div>
      <div className='space-y-1.5'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Estado del comicio
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Indicador público de la jornada electoral. Se actualiza sin
          autenticación mientras el escrutinio esté abierto.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className='space-y-3 px-6 pb-6 sm:px-8'>
      <p
        className={cn(
          'inline-flex rounded-full px-3 py-1 text-sm font-semibold tracking-wide uppercase',
          getEstadoEleccionBadgeClass(estado)
        )}
      >
        {getEstadoEleccionLabel(estado)}
      </p>
      {tipoVotacion ? (
        <p className='text-sm text-[#5f6368]'>
          Tipo de votación:{' '}
          <span className='font-medium text-[#202124]'>
            {tipoVotacion === 'POR_LISTA' ? 'Por lista' : tipoVotacion}
          </span>
        </p>
      ) : null}
      <p className='text-sm text-[#5f6368]'>
        {isFrozen
          ? 'Snapshot congelado: los indicadores públicos ya no cambian en tiempo real.'
          : 'Actualización periódica activa para reflejar el estado agregado del comicio.'}
      </p>
    </CardContent>
  </Card>
)
