import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function ForbiddenError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>403</h1>
        <span className='font-medium'>Acceso denegado</span>
        <p className='text-center text-muted-foreground'>
          No tiene permisos para acceder al Panel de Gestión. <br />
          Esta sección está reservada a la Autoridad Electoral.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Volver
          </Button>
          <Button onClick={() => navigate({ to: '/sign-in' })}>
            Ir al inicio de sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
