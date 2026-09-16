import type { ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NotFoundErrorProps = {
  /** Título mostrado debajo del número 404. */
  title?: ReactNode
  /** Detalle de qué no se encontró y por qué, para dar contexto al usuario. */
  description?: ReactNode
  /** Acción principal alternativa a "Ir al inicio". */
  backTo?: { label: string; to: string }
  /**
   * Oculta el número "404" y ajusta el alto al contenedor en lugar de
   * ocupar toda la pantalla, para incrustarlo dentro de una vista existente
   * (p. ej. el detalle de un comicio) en vez de reemplazarla por completo.
   */
  minimal?: boolean
}

export function NotFoundError({
  title = '¡Ups! Página no encontrada',
  description = (
    <>
      Parece que la página que buscas no existe <br />o fue eliminada.
    </>
  ),
  backTo,
  minimal = false,
}: NotFoundErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className={cn(minimal ? 'w-full' : 'h-svh')}>
      <div
        className={cn(
          'flex w-full flex-col gap-2',
          minimal
            ? 'items-start text-left'
            : 'm-auto h-full items-center justify-center text-center'
        )}
      >
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        )}
        <span className='font-medium'>{title}</span>
        <p className='text-muted-foreground'>{description}</p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Volver
          </Button>
          <Button onClick={() => navigate({ to: backTo?.to ?? '/' })}>
            {backTo?.label ?? 'Ir al inicio'}
          </Button>
        </div>
      </div>
    </div>
  )
}
