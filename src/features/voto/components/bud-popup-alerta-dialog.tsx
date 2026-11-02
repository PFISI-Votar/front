import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { PopupAlertaBud } from '@/features/voto/data/schema'

type BudPopupAlertaDialogProps = {
  popupAlerta?: PopupAlertaBud | null
}

/**
 * VOTAR-524: pop-up de alerta que el votante ve antes de comenzar. El titulo
 * se guarda tal cual lo escribe el admin y se muestra en mayusculas solo por
 * estilo (uppercase). Titulo y descripcion se renderizan como texto plano.
 */
export const BudPopupAlertaDialog = ({
  popupAlerta,
}: BudPopupAlertaDialogProps) => {
  const [open, setOpen] = useState(true)

  if (!popupAlerta) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='uppercase'>
            {popupAlerta.titulo}
          </AlertDialogTitle>
          <AlertDialogDescription className='whitespace-pre-line'>
            {popupAlerta.descripcion}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className='bg-[#2f6f9f] text-white hover:bg-[#285f88]'>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
