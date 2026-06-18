import { Outlet } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { ComiciosBreadcrumbs } from '@/components/layout/comicios-breadcrumbs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export const ComiciosLayout = () => {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <ComiciosBreadcrumbs />
        <Outlet />
      </Main>
    </>
  )
}
