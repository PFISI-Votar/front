import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export const CUMPLIMIENTO_LEY_25326_HREF = '/cumplimiento/ley-25326'

type CumplimientoLey25326LinkProps = {
  className?: string
}

/**
 * VOTAR-378 — Acceso a la página pública de cumplimiento Ley 25.326.
 * Usa <a> nativo para poder renderizarse fuera de RouterProvider (BUD tests).
 */
export const CumplimientoLey25326Link = ({
  className,
}: CumplimientoLey25326LinkProps) => (
  <a
    href={CUMPLIMIENTO_LEY_25326_HREF}
    className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368] transition-colors hover:text-[#2f6f9f]',
      className
    )}
  >
    <ShieldCheck className='size-3.5 shrink-0' aria-hidden='true' />
    Cómo protegemos tus datos (Ley 25.326)
  </a>
)
