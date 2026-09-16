import type { ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

type NotFoundErrorProps = {
  /** Título mostrado debajo del número 404. */
  title?: ReactNode
  /** Detalle de qué no se encontró y por qué, para dar contexto al usuario. */
  description?: ReactNode
  /** Acción principal alternativa a "Ir al inicio". */
  backTo?: { label: string; to: string }
}

export function NotFoundError({
  title = '¡Ups! Página no encontrada',
  description = (
    <>
      Parece que la página que buscas no existe <br />o fue eliminada.
    </>
  ),
  backTo,
}: NotFoundErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
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
