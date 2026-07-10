import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type BreadcrumbEntry = {
  label: string
  to?: string
  params?: Record<string, string>
}

type BreadcrumbNavProps = {
  entries: BreadcrumbEntry[]
}

export const BreadcrumbNav = ({ entries }: BreadcrumbNavProps) => {
  if (entries.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1

          return (
            <Fragment key={`${entry.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !entry.to ? (
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
