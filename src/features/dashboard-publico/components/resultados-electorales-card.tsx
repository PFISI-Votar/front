import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ResultadosPublicos } from '@/features/dashboard-publico/api/dashboard-publico-api'

type ResultadosElectoralesCardProps = {
  tipoVotacion: string
  resultados?: ResultadosPublicos | null
  isLoading?: boolean
  isError?: boolean
  className?: string
}

export const ResultadosElectoralesCard = ({
  tipoVotacion,
  resultados,
  isLoading,
  isError,
  className,
}: ResultadosElectoralesCardProps) => {
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
          <Skeleton className='h-5 w-56' />
          <Skeleton className='h-4 w-72' />
        </CardHeader>
        <CardContent className='space-y-3 px-6 pb-6 sm:px-8'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card
        className={cn(
          'gap-0 overflow-hidden rounded-2xl border-amber-200/80 bg-amber-50/40 py-0',
          className
        )}
        role='alert'
      >
        <CardHeader className='px-6 py-6 sm:px-8'>
          <CardTitle className='text-lg font-semibold'>
            Resultados no disponibles
          </CardTitle>
          <CardDescription>
            No se pudo consultar el escrutinio definitivo on-chain.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!resultados) {
    return null
  }

  const showListas =
    Boolean(resultados.porLista?.length) &&
    (tipoVotacion === 'POR_LISTA' || tipoVotacion === 'MIXTO')
  const showCandidatos =
    Boolean(resultados.porCandidato?.length) &&
    (tipoVotacion === 'POR_CANDIDATO' || tipoVotacion === 'MIXTO')

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
        className
      )}
    >
      <CardHeader className='space-y-2 px-6 pt-6 pb-2 sm:px-8'>
        <div className='flex items-center gap-2 text-[#2f6f9f]'>
          <BarChart3 className='size-4' aria-hidden='true' />
          <p className='text-xs font-semibold tracking-wide uppercase'>
            Resultados definitivos
          </p>
        </div>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Escrutinio electoral
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Totales agregados según el tipo de votación del comicio, leídos desde
          la blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8 px-6 pb-6 sm:px-8'>
        {showListas ? (
          <ResultSection title='Por lista'>
            {(resultados.porLista ?? []).map((item) => (
              <ResultRow
                key={item.idLista}
                label={`${item.nombre} (${item.sigla})`}
                accent={item.color}
                votos={item.votos}
                porcentaje={item.porcentaje}
              />
            ))}
          </ResultSection>
        ) : null}

        {showCandidatos ? (
          <ResultSection title='Por candidato'>
            {(resultados.porCandidato ?? []).map((item) => (
              <ResultRow
                key={item.idCandidato}
                label={`${item.apellido}, ${item.nombre}`}
                detail={`${item.nombreLista} · ${item.nombreCategoria}`}
                votos={item.votos}
                porcentaje={item.porcentaje}
              />
            ))}
          </ResultSection>
        ) : null}

        {!showListas && !showCandidatos ? (
          <p className='text-sm text-[#5f6368]'>
            No hay opciones oficializadas para mostrar en el escrutinio.
          </p>
        ) : null}

        <div className='grid gap-3 sm:grid-cols-2'>
          <MiniStat label='Votos en blanco' value={resultados.votosEnBlanco} />
          <MiniStat label='Votos nulos' value={resultados.votosNulos} />
        </div>
      </CardContent>
    </Card>
  )
}

const ResultSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className='space-y-3'>
    <h3 className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
      {title}
    </h3>
    <ul className='space-y-3'>{children}</ul>
  </div>
)

const ResultRow = ({
  label,
  detail,
  accent,
  votos,
  porcentaje,
}: {
  label: string
  detail?: string
  accent?: string | null
  votos: number
  porcentaje: number
}) => (
  <li className='space-y-1.5'>
    <div className='flex items-end justify-between gap-3'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-[#202124]'>{label}</p>
        {detail ? (
          <p className='truncate text-xs text-[#5f6368]'>{detail}</p>
        ) : null}
      </div>
      <p className='shrink-0 text-sm font-bold text-[#202124] tabular-nums'>
        {votos.toLocaleString('es-AR')} · {porcentaje.toLocaleString('es-AR')}%
      </p>
    </div>
    <div className='h-2 overflow-hidden rounded-full bg-[#e8edf2]'>
      <div
        className='h-full rounded-full transition-[width]'
        style={{
          width: `${Math.min(100, Math.max(0, porcentaje))}%`,
          backgroundColor: accent || '#2f6f9f',
        }}
      />
    </div>
  </li>
)

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className='rounded-xl border border-[#e8edf2] bg-[#f8fafc] px-4 py-3'>
    <p className='text-xs font-semibold tracking-wide text-[#5f6368] uppercase'>
      {label}
    </p>
    <p className='mt-1 text-xl font-extrabold text-[#202124] tabular-nums'>
      {value.toLocaleString('es-AR')}
    </p>
  </div>
)
