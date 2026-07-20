import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { EscrutinioPanel } from '@/features/dashboard-publico/components/escrutinio-panel'
import { EstadoComicioCard } from '@/features/dashboard-publico/components/estado-comicio-card'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import { TotalVotantesCard } from '@/features/padron/components/total-votantes-card'

type DashboardPublicoPageProps = {
  idEleccion: number
  section?: 'resumen' | 'padron' | 'estado' | 'resultados'
}

export const DashboardPublicoPage = ({
  idEleccion,
  section = 'resumen',
}: DashboardPublicoPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)

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
      <DashboardPublicoShell idEleccion={0} activeSection={section}>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection={section}>
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <Skeleton className='h-48 w-full rounded-2xl' />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection={section}>
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  const { nombre, estado, tipoVotacion } = comicioQuery.data
  const isFrozen = isDashboardFrozen(comicioQuery.data)

  return (
    <DashboardPublicoShell idEleccion={idEleccion} activeSection={section}>
      <DashboardPublicoHeader
        nombre={nombre}
        estado={estado}
        isFrozen={isFrozen}
        description={
          isFrozen
            ? 'El comicio está cerrado. Los indicadores del Portal de Transparencia quedaron congelados y no se actualizan en tiempo real.'
            : 'Auditoría ciudadana sin autenticación. Los indicadores públicos se actualizan con los datos agregados del comicio.'
        }
      />

      {(section === 'resumen' || section === 'resultados') && (
        <section
          aria-labelledby='escrutinio-publico-heading'
          className={section === 'resumen' ? 'mb-8 space-y-4' : 'space-y-4'}
        >
          <h2 id='escrutinio-publico-heading' className='sr-only'>
            Resultados del escrutinio
          </h2>
          <EscrutinioPanel
            idEleccion={idEleccion}
            fullCharts={section === 'resultados'}
            estadoComicio={estado}
          />
        </section>
      )}

      {(section === 'resumen' || section === 'padron') && (
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
      )}

      {(section === 'resumen' || section === 'estado') && (
        <section
          aria-labelledby='estado-publico-heading'
          className={section === 'resumen' ? 'mt-8 space-y-4' : 'space-y-4'}
        >
          <h2
            id='estado-publico-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Estado del escrutinio
          </h2>
          <EstadoComicioCard
            estado={estado}
            isFrozen={isFrozen}
            tipoVotacion={tipoVotacion}
          />
        </section>
      )}
    </DashboardPublicoShell>
  )
}
