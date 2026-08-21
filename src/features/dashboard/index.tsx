import { Link } from '@tanstack/react-router'
import { PlusCircle, ScrollText, Vote } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppLayoutConfig } from '@/components/layout/app-layout'
import {
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'

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
    headerClassName: 'hidden',
    mainClassName: 'p-0 @7xl/content:max-w-none',
  })

  const { auth } = useAuthStore()
  const nombreAdmin = auth.user?.name ?? auth.user?.email ?? 'Administrador'

  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center overflow-hidden bg-[#fdfcfa] px-6 py-16 sm:px-10',
        VOTAR_LIGHT_SURFACE_CLASS
      )}
    >
      <VotarLoginBackground />

      <div className='relative flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-16 text-center'>
        <p className='-mt-10 text-xl font-extrabold tracking-[0.4em] text-[#2f6f9f] uppercase sm:text-2xl'>
          VOTAR · Panel de administración
        </p>

        <div className='flex animate-in flex-col items-center gap-5 duration-700 ease-out fade-in-0 slide-in-from-bottom-4'>
          <h1 className='flex flex-wrap items-baseline justify-center gap-x-3 text-4xl font-extrabold tracking-tight sm:text-5xl'>
            <span className='text-[#9aa0a6]'>Hola,</span>
            <span className='text-[#2f6f9f]'>{nombreAdmin}</span>
          </h1>
          <span className='h-1 w-14 rounded-full bg-[#2f6f9f]/30' />
          <p className='max-w-xl text-lg text-[#55575d]'>
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
              className='h-16 flex-1 border-[#c9cdd2] bg-white/90 text-base text-[#2f3337] shadow-none hover:border-[#2f6f9f] hover:bg-[#f2f7fb] hover:text-[#2f6f9f]'
            >
              <Link to={acceso.href}>
                <acceso.icon className='size-5' />
                {acceso.title}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
