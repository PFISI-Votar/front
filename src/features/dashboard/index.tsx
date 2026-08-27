import { Link } from '@tanstack/react-router'
import { PlusCircle, ScrollText, Vote } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AppHeaderActions,
  useAppLayoutConfig,
} from '@/components/layout/app-layout'
import { VotarLoginBackground } from '@/features/auth/sign-in/components/login-screen-shared'

type AccesoRapido = {
  title: string
  href: string
  icon: typeof Vote
}

const ACCESOS_RAPIDOS: AccesoRapido[] = [
  { title: 'Nuevo comicio', href: '/comicios/nuevo', icon: PlusCircle },
  { title: 'Ver comicios', href: '/comicios', icon: Vote },
  { title: 'Auditoría', href: '/auditoria', icon: ScrollText },
]

export function Dashboard() {
  useAppLayoutConfig({
    fixed: false,
    headerClassName:
      'absolute top-0 inset-x-0 bg-transparent shadow-none border-none',
    mainClassName: 'p-0 @7xl/content:max-w-none',
    headerLeading: <div className='me-auto' />,
    headerTrailing: <AppHeaderActions />,
  })

  const { auth } = useAuthStore()
  const nombreAdmin = auth.user?.name ?? auth.user?.email ?? 'Administrador'

  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center overflow-hidden px-6 py-16 sm:px-10',
        'bg-[#fdfcfa] text-[#202124]',
        'dark:bg-[#020618] dark:text-[#e8eaed]'
      )}
    >
      <VotarLoginBackground />

      <div className='relative flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-16 text-center'>
        <p
          className={cn(
            '-mt-10 text-xl font-extrabold tracking-[0.4em] uppercase sm:text-2xl',
            'text-[#2f6f9f] dark:text-[#7ab3d4]'
          )}
        >
          VOTAR - Panel de administración
        </p>

        <div className='flex animate-in flex-col items-center gap-5 duration-700 ease-out fade-in-0 slide-in-from-bottom-4'>
          <h1 className='flex flex-wrap items-baseline justify-center gap-x-3 text-4xl font-extrabold tracking-tight sm:text-5xl'>
            <span className='text-[#9aa0a6] dark:text-[#5f6368]'>Hola,</span>
            <span className='text-[#2f6f9f] dark:text-[#7ab3d4]'>
              {nombreAdmin}
            </span>
          </h1>
          <span className='h-1 w-14 rounded-full bg-[#2f6f9f]/30 dark:bg-[#7ab3d4]/20' />
          <p className='max-w-xl text-lg text-[#55575d] dark:text-[#9aa0a6]'>
            Votación electrónica segura y auditable, con respaldo criptográfico
            en blockchain.
          </p>
        </div>

        <div className='flex w-full flex-col gap-4 sm:flex-row sm:justify-center'>
          {ACCESOS_RAPIDOS.map((acceso) => (
            <Button
              key={acceso.href}
              asChild
              variant='outline'
              size='lg'
              className={cn(
                'h-16 flex-1 text-base shadow-none',
                'border-[#c9cdd2] bg-white/90 text-[#2f6f9f] hover:border-[#2f6f9f] hover:bg-[#f2f7fb] hover:text-[#2f6f9f]',
                'dark:border-[#2a2a2e] dark:bg-[#0f1629]/80 dark:text-[#7ab3d4] dark:hover:border-[#7ab3d4] dark:hover:bg-[#1a2535] dark:hover:text-[#7ab3d4]'
              )}
            >
              <Link to={acceso.href}>
                <acceso.icon className='size-5 text-[#2f6f9f] dark:text-[#7ab3d4]' />
                {acceso.title}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
