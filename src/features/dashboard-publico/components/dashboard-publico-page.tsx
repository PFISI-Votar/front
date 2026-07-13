import { useEffect, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { Eye, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { VotarLoginBackground } from '@/features/auth/sign-in/components/login-screen-shared'
import {
  getEstadoEleccionBadgeClass,
  getEstadoEleccionLabel,
} from '@/features/dashboard-publico/lib/estado-eleccion'
import { TotalVotantesCard } from '@/features/padron/components/total-votantes-card'
import { obtenerConfiguracionBud } from '@/features/voto/api/voto-api'

type DashboardPublicoPageProps = {
  idEleccion: number
}

export const DashboardPublicoPage = ({
  idEleccion,
}: DashboardPublicoPageProps) => {
  const comicioQuery = useQuery({
    queryKey: ['dashboard-publico-comicio', idEleccion],
    queryFn: () => obtenerConfiguracionBud(idEleccion),
    enabled: Number.isFinite(idEleccion) && idEleccion > 0,
    refetchInterval: (query) => {
      const data = query.state.data
      if (
        data?.resultadosDefinitivos ||
        data?.snapshotCongelado ||
        data?.estado === 'CERRADA' ||
        data?.estado === 'ESCRUTADA'
      ) {
        return false
      }
      return 30_000
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      return failureCount < 2
    },
  })

  useEffect(() => {
    const previousTitle = document.title
    const nombre = comicioQuery.data?.nombre
    document.title = nombre
      ? `VOTAR - Dashboard público · ${nombre}`
      : 'VOTAR - Dashboard público'
    return () => {
      document.title = previousTitle
    }
  }, [comicioQuery.data?.nombre])

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardShell>
        <ErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardShell>
    )
  }

  if (comicioQuery.isLoading) {
    return (
      <DashboardShell>
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <Skeleton className='h-48 w-full rounded-2xl' />
      </DashboardShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardShell>
        <ErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardShell>
    )
  }

  const { nombre, estado, resultadosDefinitivos, snapshotCongelado } =
    comicioQuery.data
  const isFrozen =
    resultadosDefinitivos === true ||
    snapshotCongelado === true ||
    estado === 'CERRADA' ||
    estado === 'ESCRUTADA'

  return (
    <DashboardShell>
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
          <p className='text-sm font-medium text-[#5f6368]'>
            Dashboard público
          </p>
          <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
            {nombre}
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[#5f6368] sm:text-base'>
            {isFrozen
              ? 'El comicio está cerrado. Los indicadores del Portal de Transparencia quedaron congelados y no se actualizan en tiempo real.'
              : 'Información de auditoría ciudadana del padrón electoral. El volumen del electorado es público y permanece inmutable una vez consolidado.'}
          </p>
        </div>
      </header>

      <section aria-labelledby='padron-publico-heading' className='space-y-4'>
        <div className='flex items-center gap-2'>
          <ShieldCheck className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2
            id='padron-publico-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Padrón electoral
          </h2>
        </div>
        <TotalVotantesCard idEleccion={idEleccion} />
      </section>
    </DashboardShell>
  )
}

const DashboardShell = ({ children }: { children: ReactNode }) => (
  <main className='relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'>
    <VotarLoginBackground />
    <div className='relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14'>
      <div className='mb-10 flex items-center justify-between gap-4'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
        <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
          Transparencia electoral
        </p>
      </div>
      {children}
    </div>
  </main>
)

type ErrorPanelProps = {
  title: string
  description: string
}

const ErrorPanel = ({ title, description }: ErrorPanelProps) => (
  <div
    className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-8 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:px-8'
    role='alert'
  >
    <h1 className='text-xl font-bold tracking-tight text-[#202124]'>{title}</h1>
    <p className='mt-2 text-sm leading-relaxed text-[#5f6368]'>{description}</p>
  </div>
)
