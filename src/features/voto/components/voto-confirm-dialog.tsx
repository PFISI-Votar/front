import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type {
  BoletaDigital,
  SeleccionesPorCategoria,
} from '@/features/voto/data/schema'
import { findCandidatoSeleccionado } from '@/features/voto/utils/seleccion-voto'

type VotoConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  boleta: BoletaDigital
  selecciones: SeleccionesPorCategoria
  votoEnBlanco: boolean
  isPending: boolean
  onConfirm: () => void
}

export const VotoConfirmDialog = ({
  open,
  onOpenChange,
  boleta,
  selecciones,
  votoEnBlanco,
  isPending,
  onConfirm,
}: VotoConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar voto</AlertDialogTitle>
          <AlertDialogDescription>
            Revisá tu selección antes de registrar definitivamente el voto.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {votoEnBlanco ? (
          <p className='rounded-md border bg-muted p-3 text-sm font-medium'>
            Confirmás voto en blanco.
          </p>
        ) : (
          <ul className='space-y-2 text-sm'>
            {boleta.categorias.map((categoria) => {
              const candidato = findCandidatoSeleccionado(
                boleta,
                categoria.idCategoria,
                selecciones[categoria.idCategoria]
              )

              return (
                <li
                  key={categoria.idCategoria}
                  className='rounded-md border p-3'
                >
                  <span className='font-semibold'>{categoria.nombre}:</span>{' '}
                  {candidato
                    ? `${candidato.nombreCompleto} — ${candidato.agrupacionPolitica}, lista ${candidato.numeroLista}`
                    : 'Sin selección'}
                </li>
              )
            })}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && (
              <Loader2
                className='me-2 size-4 animate-spin'
                aria-hidden='true'
              />
            )}
            Confirmar Voto
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
