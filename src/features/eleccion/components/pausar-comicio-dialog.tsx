import { useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Pause, X } from 'lucide-react'
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
import { usePausarEleccion } from '@/features/eleccion/hooks/use-pausar-eleccion'

interface PausarComicioDialogProps {
  idEleccion: number
  nombreEleccion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const PausarComicioDialog = ({
  idEleccion,
  nombreEleccion,
  open,
  onOpenChange,
}: PausarComicioDialogProps) => {
  const [razon, setRazon] = useState('')
  const { runInBackground, isRunning } = usePausarEleccion(idEleccion)
  const { data: estadoPendiente } = useQuery({
    queryKey: ['solicitud-pausa', idEleccion],
    queryFn: () => obtenerEstadoPausa(idEleccion),
    enabled: open,
  })

  const yaHaySolicitud =
    estadoPendiente?.tipo === 'PAUSAR' && estadoPendiente.confirmaciones > 0

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
          <DialogTitle>Pausa de emergencia</DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-3'>
              <p>
                Detiene preventivamente la urna digital del comicio "
                {nombreEleccion}" ante un incidente. Bloquea nuevos votos de
                inmediato; las consultas de lectura siguen disponibles. La
                confirmación continuará en segundo plano (puede tardar por las
                transacciones on-chain) y podrá seguir navegando el panel.
              </p>
              {yaHaySolicitud ? (
                <Alert>
                  <AlertCircle className='size-4' />
                  <AlertTitle>
                    Ya hay una solicitud de pausa pendiente
                  </AlertTitle>
                  <AlertDescription>
                    {estadoPendiente?.confirmaciones}/
                    {estadoPendiente?.requeridas} autoridades PAUSER confirmaron
                    {estadoPendiente?.razon
                      ? ` — razón registrada: "${estadoPendiente.razon}"`
                      : ''}
                    . Tu confirmación se sumará a las existentes.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Ninguna cuenta puede pausar en solitario: se requiere que otra
                  autoridad PAUSER confirme esta misma solicitud para que se
                  ejecute on-chain.
                </p>
              )}
              <div className='space-y-2'>
                <Label htmlFor='pausar-razon'>Razón de la pausa</Label>
                <Textarea
                  id='pausar-razon'
                  value={razon}
                  onChange={(event) => setRazon(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder='Describa el incidente que motiva la pausa (mínimo 10 caracteres) — Ctrl+Enter para confirmar'
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
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            <Pause />
            {yaHaySolicitud ? 'Confirmar pausa' : 'Pausar comicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
