import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MANUAL_AUDITORES_HREF } from '@/features/manual-auditores/manual-auditores-content'

type ManualAuditoresLinkProps = {
  className?: string
}

/**
 * VOTAR-396 — Acceso al manual técnico de transparencia para auditores.
 * Usa <a> nativo para poder renderizarse fuera de RouterProvider.
 */
export const ManualAuditoresLink = ({
  className,
}: ManualAuditoresLinkProps) => (
  <a
    href={MANUAL_AUDITORES_HREF}
    className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368] transition-colors hover:text-[#2f6f9f]',
      className
    )}
  >
    <BookOpen className='size-3.5 shrink-0' aria-hidden='true' />
    Manual para auditores
  </a>
)
