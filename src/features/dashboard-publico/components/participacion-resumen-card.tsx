import { Link } from '@tanstack/react-router'
import { Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useParticipacionPublica } from '@/features/dashboard-publico/hooks/use-participacion-publica'

type ParticipacionResumenCardProps = {
  idEleccion: number
  isFrozen: boolean
  className?: string
}

export const ParticipacionResumenCard = ({
  idEleccion,
  isFrozen,
  className,
}: ParticipacionResumenCardProps) => {
  const query = useParticipacionPublica(idEleccion, { isFrozen })

  if (query.isLoading) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
          className
        )}
        aria-busy='true'
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-6 sm:px-8'>
          <Skeleton className='size-11 rounded-xl' />
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-10 w-24' />
        </CardHeader>
      </Card>
    )
  }

  if (query.isError || !query.data) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
          className
        )}
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-6 sm:px-8'>
          <div
            className='flex size-11 items-center justify-center rounded-xl bg-[#2f6f9f]/10 text-[#2f6f9f]'
            aria-hidden='true'
          >
            <Percent className='size-5' />
          </div>
          <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
            Participación electoral
          </CardTitle>
          <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
            Las métricas on-chain estarán disponibles cuando el comicio tenga
            contratos desplegados y padrón consolidado.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const porcentaje = query.data.formula.porcentajeParticipacion
  const porcentajeLabel = Number.isInteger(porcentaje)
    ? `${porcentaje}%`
    : `${porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`

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
            Vista rápida del porcentaje agregado. Abrí las analíticas para la
            fórmula, la curva temporal y el desglose por categoría.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 px-6 pb-6 sm:px-8'>
        <p className='text-4xl font-extrabold tracking-tight text-[#2f6f9f] tabular-nums'>
          {porcentajeLabel}
        </p>
        <Link
          to='/comicios/$idEleccion/dashboard/participacion'
          params={{ idEleccion: String(idEleccion) }}
          className='inline-flex rounded-lg bg-[#2f6f9f]/10 px-3 py-1.5 text-sm font-medium text-[#2f6f9f] transition-colors hover:bg-[#2f6f9f]/15 focus-visible:ring-2 focus-visible:ring-[#2f6f9f] focus-visible:outline-none'
          aria-label='Ver analíticas de participación'
        >
          Ver analíticas
        </Link>
      </CardContent>
    </Card>
  )
}
