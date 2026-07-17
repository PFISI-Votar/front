import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  getEstadoEleccionBadgeClass,
  getEstadoEleccionLabel,
} from '@/features/dashboard-publico/lib/estado-eleccion'

type DashboardPublicoHeaderProps = {
  nombre: string
  estado: string
  isFrozen: boolean
  description: string
}

export const DashboardPublicoHeader = ({
  nombre,
  estado,
  isFrozen,
  description,
}: DashboardPublicoHeaderProps) => (
  <header className='mb-8 space-y-4'>
    <div className='flex flex-wrap items-center gap-2'>
      <Badge
        variant='outline'
        className='gap-1.5 border-[#d0e3f0] bg-[#2f6f9f]/8 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-[#2f6f9f] uppercase'
      >
        <Eye className='size-3.5' aria-hidden='true' />
        Acceso público
      </Badge>
      <Badge
        variant='outline'
        className={cn(
          'px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide uppercase',
          getEstadoEleccionBadgeClass(estado)
        )}
      >
        {getEstadoEleccionLabel(estado)}
      </Badge>
      {isFrozen ? (
        <Badge
          variant='outline'
          className='border-slate-300 bg-slate-100 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-slate-800 uppercase'
        >
          Resultados Definitivos e Inmutables
        </Badge>
      ) : null}
    </div>

    <div className='space-y-2'>
      <p className='text-sm font-medium text-[#5f6368]'>Dashboard público</p>
      <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
        {nombre}
      </h1>
      <p className='max-w-2xl text-sm leading-relaxed text-[#5f6368] sm:text-base'>
        {description}
      </p>
    </div>
  </header>
)
