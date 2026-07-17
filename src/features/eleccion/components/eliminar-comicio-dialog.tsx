import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

type EliminarComicioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nombreEleccion: string
  isLoading?: boolean
  onConfirm: () => void
}

const FORM_ID = 'eliminar-comicio-form'

export const EliminarComicioDialog = ({
  open,
  onOpenChange,
  nombreEleccion,
  isLoading = false,
  onConfirm,
}: EliminarComicioDialogProps) => {
  const [value, setValue] = useState('')
  const isConfirmed = value === nombreEleccion

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValue('')
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isConfirmed) {
      return
    }
    onConfirm()
  }

  const handleConfirmInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      form={FORM_ID}
      disabled={!isConfirmed}
      title='¿Eliminar el comicio?'
      desc={
        <form id={FORM_ID} onSubmit={handleSubmit} className='space-y-4'>
          <p>
            Esta acción es <strong>irreversible</strong>. Se eliminarán todas
            las listas, candidatos y configuraciones asociadas al comicio{' '}
            <strong>{nombreEleccion}</strong>.
          </p>
          <Label className='flex flex-col items-start gap-1.5'>
            <span>
              Escribí <strong>{nombreEleccion}</strong> para confirmar:
            </span>
            <Input
              value={value}
              onChange={handleConfirmInputChange}
              placeholder={nombreEleccion}
              autoFocus
              aria-label={`Escribí ${nombreEleccion} para confirmar`}
              disabled={isLoading}
            />
          </Label>
        </form>
      }
      cancelBtnText='Cancelar'
      confirmText='Sí, eliminar comicio'
      destructive
      isLoading={isLoading}
    />
  )
}
