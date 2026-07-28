import { Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ParticipacionHeroCardProps = {
  porcentajeParticipacion: number
  totalSufragios: number
  totalPadron: number
  className?: string
}

export const ParticipacionHeroCard = ({
  porcentajeParticipacion,
  totalSufragios,
  totalPadron,
  className,
}: ParticipacionHeroCardProps) => {
  const porcentajeLabel = Number.isInteger(porcentajeParticipacion)
    ? `${porcentajeParticipacion}%`
    : `${porcentajeParticipacion.toLocaleString('es-AR', {
        maximumFractionDigits: 1,
      })}%`

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
          <Percent className='size-5' />
        </div>
        <div className='space-y-1.5'>
          <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
            Participación Electoral: {porcentajeLabel}
          </CardTitle>
          <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
            Porcentaje agregado de sufragios emitidos sobre el padrón
            habilitado.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-2 px-6 pb-6 sm:px-8'>
        <p
          className='text-5xl font-extrabold tracking-tight text-[#2f6f9f] tabular-nums sm:text-6xl'
          aria-label={`Participación electoral ${porcentajeLabel}`}
        >
          {porcentajeLabel}
        </p>
        <p className='text-sm text-[#5f6368]'>
          {totalSufragios.toLocaleString('es-AR')} sufragios de{' '}
          {totalPadron.toLocaleString('es-AR')} electores habilitados
        </p>
      </CardContent>
    </Card>
  )
}
