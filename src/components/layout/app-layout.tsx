import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export type AppLayoutConfig = {
  fixed?: boolean
  headerClassName?: string
  mainFixed?: boolean
  mainClassName?: string
  headerLeading?: ReactNode
  headerTrailing?: ReactNode
}

const DEFAULT_CONFIG: AppLayoutConfig = {
  fixed: true,
  mainFixed: false,
}

type AppLayoutContextValue = {
  setConfig: (config: AppLayoutConfig) => void
  resetConfig: () => void
}

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null)

export const AppHeaderActions = () => (
  <>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </>
)

type AppLayoutProviderProps = {
  children: ReactNode
}

export const AppLayoutProvider = ({ children }: AppLayoutProviderProps) => {
  const [config, setConfigState] = useState<AppLayoutConfig>(DEFAULT_CONFIG)

  const setConfig = useCallback((nextConfig: AppLayoutConfig) => {
    setConfigState((current) => ({ ...current, ...nextConfig }))
  }, [])

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_CONFIG)
  }, [])

  const contextValue = useMemo(
    () => ({ setConfig, resetConfig }),
    [setConfig, resetConfig]
  )

  return (
    <AppLayoutContext.Provider value={contextValue}>
      <AppLayout config={config}>{children}</AppLayout>
    </AppLayoutContext.Provider>
  )
}

type AppLayoutProps = {
  children: ReactNode
  config: AppLayoutConfig
}

const AppLayout = ({ children, config }: AppLayoutProps) => {
  const headerLeading = config.headerLeading ?? <Search className='me-auto' />
  const headerTrailing = config.headerTrailing ?? <AppHeaderActions />

  return (
    <>
      <Header fixed={config.fixed} className={config.headerClassName}>
        {headerLeading}
        {headerTrailing}
      </Header>
      <Main fixed={config.mainFixed} className={config.mainClassName}>
        <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <AppBreadcrumbs />
          {children}
        </div>
      </Main>
    </>
  )
}

export const useAppLayoutConfig = (config: AppLayoutConfig) => {
  const context = useContext(AppLayoutContext)

  if (!context) {
    throw new Error('useAppLayoutConfig must be used within AppLayoutProvider')
  }

  const { setConfig, resetConfig } = context

  useEffect(() => {
    setConfig(config)
    return resetConfig
  }, [
    config.fixed,
    config.headerClassName,
    config.mainFixed,
    config.mainClassName,
    config.headerLeading,
    config.headerTrailing,
    resetConfig,
    setConfig,
  ])
}
