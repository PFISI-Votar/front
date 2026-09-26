import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MANUAL_VOTANTE_HREF } from '@/features/manual-votante/manual-votante-content'

type ManualVotanteLinkProps = {
  className?: string
  /**
   * Abrir en otra pestaña. En la cabina evita perder la boleta en curso.
   */
  openInNewTab?: boolean
}

/**
 * VOTAR-389 — Acceso al manual del votante.
 * Usa <a> nativo para poder renderizarse fuera de RouterProvider (BUD).
 */
export const ManualVotanteLink = ({
  className,
  openInNewTab = false,
}: ManualVotanteLinkProps) => (
  <a
    href={MANUAL_VOTANTE_HREF}
    data-testid='manual-votante-link'
    target={openInNewTab ? '_blank' : undefined}
    rel={openInNewTab ? 'noopener noreferrer' : undefined}
    className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368] transition-colors hover:text-[#2f6f9f] focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/30 focus-visible:outline-none',
      className
    )}
  >
    <BookOpen className='size-3.5 shrink-0' aria-hidden='true' />
    Manual del votante
    {openInNewTab ? (
      <span className='sr-only'> (se abre en una pestaña nueva)</span>
    ) : null}
  </a>
)
