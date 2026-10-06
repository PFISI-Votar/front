import { Outlet } from '@tanstack/react-router'
import { UserCog } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useAppLayoutConfig } from '@/components/layout/app-layout'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Seguridad',
    href: '/settings',
    icon: <UserCog size={18} />,
  },
]

export function Settings() {
  useAppLayoutConfig({ mainFixed: true })

  return (
    <>
      <div className='space-y-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Perfil
        </h1>
        <p className='text-muted-foreground'>
          Seguridad de la cuenta de autoridad electoral.
        </p>
      </div>
      <Separator className='my-4 lg:my-6' />
      <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <aside className='top-0 lg:sticky lg:w-1/5'>
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className='flex w-full overflow-y-hidden p-1'>
          <Outlet />
        </div>
      </div>
    </>
  )
}
