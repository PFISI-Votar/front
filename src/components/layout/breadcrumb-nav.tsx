import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, ChevronDown } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type BreadcrumbMenuItem = {
  label: string
  to: string
  params?: Record<string, string>
}

export type BreadcrumbEntry = {
  label: string
  to?: string
  params?: Record<string, string>
  menuItems?: BreadcrumbMenuItem[]
}

type BreadcrumbNavProps = {
  entries: BreadcrumbEntry[]
}

const BreadcrumbSectionMenu = ({ entry }: { entry: BreadcrumbEntry }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      className='flex items-center gap-1 font-normal text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-hidden'
      aria-label='Cambiar sección del comicio'
    >
      {entry.label}
      <ChevronDown className='size-3.5' />
    </DropdownMenuTrigger>
    <DropdownMenuContent align='start'>
      {entry.menuItems?.map((item) => {
        const isActive = item.label === entry.label
        return (
          <DropdownMenuItem key={item.label} asChild>
            <Link
              to={item.to}
              params={item.params}
              aria-current={isActive ? 'page' : undefined}
            >
              <Check
                className={isActive ? 'opacity-100' : 'opacity-0'}
                aria-hidden='true'
              />
              {item.label}
            </Link>
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuContent>
  </DropdownMenu>
)

export const BreadcrumbNav = ({ entries }: BreadcrumbNavProps) => {
  if (entries.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1
          const hasMenu = entry.menuItems && entry.menuItems.length > 0

          return (
            <Fragment key={`${entry.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {hasMenu ? (
                  <BreadcrumbSectionMenu entry={entry} />
                ) : isLast || !entry.to ? (
                  <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={entry.to} params={entry.params}>
                      {entry.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
