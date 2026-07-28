import { Link } from '@tanstack/react-router'
import { AlertCircle, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type ComicioFrozenGuardProps = {
  isLoading: boolean
  isEditable: boolean
  idEleccion: string
  idLista: string
  children: React.ReactNode
}

export const ComicioFrozenGuard = ({
  isLoading,
  isEditable,
  idEleccion,
  idLista,
  children,
}: ComicioFrozenGuardProps) => {
  if (isLoading) {
    return (
      <p className='text-sm text-muted-foreground' aria-live='polite'>
        Cargando…
      </p>
    )
  }

  if (!isEditable) {
    return (
      <div className='flex flex-col gap-4'>
        <Alert>
          <Lock className='size-4' />
          <AlertTitle>Oferta congelada</AlertTitle>
          <AlertDescription>
            El comicio fue oficializado. No se pueden registrar ni modificar
            candidatos.
          </AlertDescription>
        </Alert>
        <Button asChild variant='outline'>
          <Link
            to='/comicios/$idEleccion/listas/$idLista'
            params={{ idEleccion, idLista }}
          >
            Volver a la lista
          </Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

type ConflictAlertProps = {
  message: string | null
}

export const ConflictAlert = ({ message }: ConflictAlertProps) => {
  if (!message) {
    return null
  }

  return (
    <Alert variant='destructive'>
      <AlertCircle className='size-4' />
      <AlertTitle>Operación denegada (409 Conflict)</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
