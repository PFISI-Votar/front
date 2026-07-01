import { Loader2 } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'
import { getDisplayNameInitials } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type {
  BoletaDigital,
  CandidatoBoletaDigital,
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

const getListImageUrl = (candidato: CandidatoBoletaDigital) =>
  candidato.imagenListaUrl ??
  candidato.logoListaUrl ??
  candidato.fotoListaUrl ??
  null

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
                  <span className='block font-semibold'>
                    {categoria.nombre}
                  </span>
                  {candidato ? (
                    <div className='mt-2 flex items-center gap-3'>
                      <Avatar className='size-12 rounded-xl border bg-muted'>
                        {candidato.fotoUrl && (
                          <AvatarImage
                            src={resolveMediaUrl(candidato.fotoUrl)}
                            alt={`Foto de ${candidato.nombreCompleto}`}
                            className='object-cover'
                          />
                        )}
                        <AvatarFallback className='rounded-xl'>
                          {getDisplayNameInitials(candidato.nombreCompleto)}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className='h-12 w-20 rounded-xl border bg-muted'>
                        {getListImageUrl(candidato) && (
                          <AvatarImage
                            src={resolveMediaUrl(getListImageUrl(candidato))}
                            alt={`Logo de ${candidato.agrupacionPolitica}`}
                            className='object-cover'
                          />
                        )}
                        <AvatarFallback className='rounded-xl text-xs'>
                          Lista {candidato.numeroLista}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <p className='font-medium'>
                          {candidato.nombreCompleto}
                        </p>
                        <p className='text-muted-foreground'>
                          {candidato.agrupacionPolitica}, lista{' '}
                          {candidato.numeroLista}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className='mt-1 block text-muted-foreground'>
                      Sin selección
                    </span>
                  )}
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
