import { useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, PlayCircle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { obtenerEstadoPausa } from '@/features/eleccion/api/eleccion-api'
import { useReanudarEleccion } from '@/features/eleccion/hooks/use-reanudar-eleccion'

interface ReanudarComicioDialogProps {
  idEleccion: number
  nombreEleccion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ReanudarComicioDialog = ({
  idEleccion,
  nombreEleccion,
  open,
  onOpenChange,
}: ReanudarComicioDialogProps) => {
  const [razon, setRazon] = useState('')
  const { runInBackground, isRunning } = useReanudarEleccion(idEleccion)
  const { data: estadoPendiente } = useQuery({
    queryKey: ['solicitud-pausa', idEleccion],
    queryFn: () => obtenerEstadoPausa(idEleccion),
    enabled: open,
  })

  const yaHaySolicitud =
    estadoPendiente?.tipo === 'REANUDAR' && estadoPendiente.confirmaciones > 0

  const isConfirmDisabled = isRunning || razon.trim().length < 10

  const handleConfirm = () => {
    onOpenChange(false)
    runInBackground(razon)
    setRazon('')
  }

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      if (!isConfirmDisabled) {
        handleConfirm()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reanudar comicio</DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-3'>
              <p>
                Reanuda la operación del comicio "{nombreEleccion}", pausado por
                medidas de seguridad. La confirmación continuará en segundo
                plano (puede tardar por las transacciones on-chain) y podrá
                seguir navegando el panel.
              </p>
              {yaHaySolicitud ? (
                <Alert>
                  <AlertCircle className='size-4' />
                  <AlertTitle>
                    Ya hay una solicitud de reanudación pendiente
                  </AlertTitle>
                  <AlertDescription>
                    {estadoPendiente?.confirmaciones}/
                    {estadoPendiente?.requeridas} autoridades PAUSER confirmaron
                    {estadoPendiente?.razon
                      ? ` — justificación registrada: "${estadoPendiente.razon}"`
                      : ''}
                    . Tu confirmación se sumará a las existentes.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Ninguna cuenta puede reanudar en solitario: se requiere que
                  otra autoridad PAUSER confirme esta misma solicitud para que
                  se ejecute on-chain.
                </p>
              )}
              <div className='space-y-2'>
                <Label htmlFor='reanudar-razon'>
                  Justificación de la reanudación
                </Label>
                <Textarea
                  id='reanudar-razon'
                  value={razon}
                  onChange={(event) => setRazon(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder='Describa cómo se resolvió el incidente (mínimo 10 caracteres) — Ctrl+Enter para confirmar'
                  rows={3}
                />
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            <X />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
            <PlayCircle />
            {yaHaySolicitud ? 'Confirmar reanudación' : 'Reanudar comicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
