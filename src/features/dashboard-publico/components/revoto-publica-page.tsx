import { isAxiosError } from 'axios'
import { Repeat2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { RevotoOverwriteChart } from '@/features/dashboard-publico/components/revoto-overwrite-chart'
import { RevotoStatsCards } from '@/features/dashboard-publico/components/revoto-stats-cards'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import { useRevotoStatsPublica } from '@/features/dashboard-publico/hooks/use-revoto-stats-publica'
import { useSeccionDashboardVisible } from '@/features/dashboard-publico/hooks/use-seccion-dashboard-visible'

type RevotoPublicaPageProps = {
  idEleccion: number
}

export const RevotoPublicaPage = ({ idEleccion }: RevotoPublicaPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  const isFrozen = comicioQuery.data
    ? isDashboardFrozen(comicioQuery.data)
    : false
  const visible = useSeccionDashboardVisible(idEleccion, 'revoto')
  const revotoQuery = useRevotoStatsPublica(idEleccion, {
    isFrozen,
    // VOTAR-459: esperar a que comicioQuery resuelva antes de decidir si se
    // habilita — de lo contrario, en el primer render `visible` es `undefined`
    // (aún no sabemos si está oculta) y la query dispara igual, filtrando un
    // request a una sección oculta antes de que el guard del backend importe.
    enabled: comicioQuery.isSuccess ? visible !== false : false,
  })

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardPublicoShell idEleccion={0} activeSection='revoto'>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading || revotoQuery.isLoading) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='revoto'>
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <div className='space-y-4'>
          <Skeleton className='h-32 w-full rounded-2xl' />
          <Skeleton className='h-64 w-full rounded-2xl' />
        </div>
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='revoto'>
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  if (visible === false) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='revoto'>
        <DashboardPublicoHeader
          nombre={comicioQuery.data.nombre}
          estado={comicioQuery.data.estado}
          isFrozen={isFrozen}
          description='Analíticas públicas de dinámica de re-voto.'
        />
        <DashboardPublicoErrorPanel
          title='Sección no disponible'
          description='La autoridad electoral no publica esta información mientras el comicio está en curso. Estará disponible al cierre.'
        />
      </DashboardPublicoShell>
    )
  }

  if (revotoQuery.isError || !revotoQuery.data) {
    const status = isAxiosError(revotoQuery.error)
      ? revotoQuery.error.response?.status
      : undefined
    const description =
      status === 422
        ? 'El comicio aún no tiene contratos electorales desplegados on-chain para consultar métricas.'
        : status === 503
          ? 'La consulta on-chain no está disponible en este momento. Reintentá más tarde.'
          : 'No se pudieron cargar las estadísticas de re-voto. Verificá que los contratos estén desplegados.'

    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='revoto'>
        <DashboardPublicoHeader
          nombre={comicioQuery.data.nombre}
          estado={comicioQuery.data.estado}
          isFrozen={isFrozen}
          description='Analíticas públicas de dinámica de re-voto.'
        />
        <DashboardPublicoErrorPanel
          title='Métricas no disponibles'
          description={description}
        />
      </DashboardPublicoShell>
    )
  }

  const data = revotoQuery.data

  return (
    <DashboardPublicoShell idEleccion={idEleccion} activeSection='revoto'>
      <DashboardPublicoHeader
        nombre={comicioQuery.data.nombre}
        estado={comicioQuery.data.estado}
        isFrozen={isFrozen || data.snapshotCongelado}
        description={
          isFrozen || data.snapshotCongelado
            ? 'Snapshot congelado: las métricas de re-voto reflejan el estado on-chain al cierre del comicio.'
            : 'Estadísticas agregadas de sobreescritura sin autenticación. Se actualizan automáticamente cada pocos segundos.'
        }
      />

      <section aria-labelledby='revoto-analytics-heading' className='space-y-6'>
        <div className='flex items-center gap-2'>
          <Repeat2 className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2
            id='revoto-analytics-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Analíticas de re-voto
          </h2>
        </div>

        <RevotoStatsCards
          totalRevotes={data.totalRevotes}
          uniqueVoters={data.uniqueVoters}
          overwriteRatio={data.overwriteRatio}
        />
        <RevotoOverwriteChart serieTemporal={data.serieTemporal} />
      </section>
    </DashboardPublicoShell>
  )
}
