import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { VotarLoginBackground } from '@/features/auth/sign-in/components/login-screen-shared'

type DashboardSection =
  | 'resumen'
  | 'padron'
  | 'estado'
  | 'resultados'
  | 'oferta'
  | 'participacion'
  | 'revoto'
  | 'transacciones'

type DashboardPublicoShellProps = {
  idEleccion: number
  activeSection?: DashboardSection
  children: ReactNode
}

const navItems = [
  {
    section: 'resumen' as const,
    label: 'Resumen',
    to: '/comicios/$idEleccion/dashboard',
  },
  {
    section: 'resultados' as const,
    label: 'Resultados',
    to: '/comicios/$idEleccion/dashboard/resultados',
  },
  {
    section: 'oferta' as const,
    label: 'Oferta electoral',
    to: '/comicios/$idEleccion/dashboard/oferta',
  },
  {
    section: 'padron' as const,
    label: 'Padrón',
    to: '/comicios/$idEleccion/dashboard/padron',
  },
  {
    section: 'participacion' as const,
    label: 'Participación',
    to: '/comicios/$idEleccion/dashboard/participacion',
  },
  {
    section: 'revoto' as const,
    label: 'Re-voto',
    to: '/comicios/$idEleccion/dashboard/revoto',
  },
  {
    section: 'transacciones' as const,
    label: 'Transacciones',
    to: '/comicios/$idEleccion/dashboard/transacciones',
  },
  {
    section: 'estado' as const,
    label: 'Estado',
    to: '/comicios/$idEleccion/dashboard/estado',
  },
]

export const DashboardPublicoShell = ({
  idEleccion,
  activeSection = 'resumen',
  children,
}: DashboardPublicoShellProps) => (
  <main className='relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'>
    <VotarLoginBackground />
    <div className='relative mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-10 sm:px-6 sm:py-14'>
      <div className='mb-10 flex items-center justify-between gap-4'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
        <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
          Transparencia electoral
        </p>
      </div>

      <nav
        aria-label='Secciones del dashboard público'
        className='mb-8 flex flex-wrap gap-2 border-b border-[#e4e7eb] pb-4'
      >
        {navItems.map((item) => (
          <Link
            key={item.section}
            to={item.to}
            params={{ idEleccion: String(idEleccion) }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              activeSection === item.section
                ? 'bg-[#2f6f9f]/10 text-[#2f6f9f]'
                : 'text-[#5f6368] hover:bg-[#2f6f9f]/5 hover:text-[#2f6f9f]'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  </main>
)

type ErrorPanelProps = {
  title: string
  description: string
}

export const DashboardPublicoErrorPanel = ({
  title,
  description,
}: ErrorPanelProps) => (
  <div
    className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-8 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:px-8'
    role='alert'
  >
    <h1 className='text-xl font-bold tracking-tight text-[#202124]'>{title}</h1>
    <p className='mt-2 text-sm leading-relaxed text-[#5f6368]'>{description}</p>
  </div>
)
