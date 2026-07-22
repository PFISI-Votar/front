import { AlertTriangle, Link2 } from 'lucide-react'
import { formatDateTime24ForDisplay } from '@/lib/datetime'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getAuditEventLabel } from '@/features/audit-log/data/event-labels'
import type { AuditLogItem } from '@/features/audit-log/data/schema'
import { truncateHash } from '@/features/audit-log/lib/format-audit-log'

type AuditLogDetailSheetProps = {
  item: AuditLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AuditLogDetailSheet = ({
  item,
  open,
  onOpenChange,
}: AuditLogDetailSheetProps) => {
  if (item == null) {
    return null
  }

  const eventLabel = getAuditEventLabel(item.tipoEvento)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-6 py-5 text-start'>
          <SheetTitle>Detalle del evento #{item.idLog}</SheetTitle>
          <SheetDescription>
            Registro institucional off-chain (VOTAR-370/371)
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-6 overflow-y-auto px-6 py-5'>
          {item.tipoEvento === 'VOTO_EMITIDO' && (
            <Alert>
              <AlertTriangle className='size-4' aria-hidden='true' />
              <AlertTitle>Evento anónimo</AlertTitle>
              <AlertDescription>
                Este sufragio no expone terminal ni operador identificable (Ley
                25.326).
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={eventLabel.variant}>{eventLabel.label}</Badge>
              <span className='text-sm text-muted-foreground'>
                {formatDateTime24ForDisplay(item.timestamp)}
              </span>
            </div>

            <DetailRow
              label='Comicio'
              value={
                item.idEleccion != null
                  ? `#${item.idEleccion}`
                  : 'Global (sin comicio)'
              }
            />
            <DetailRow
              label='ID ofuscado del operador'
              value={item.actor}
              mono
            />
            <DetailRow
              label='Terminal criptográfico'
              value={item.identificadorTerminal ?? '—'}
              mono
            />
            <DetailRow label='Endpoint' value={item.endpoint} mono />
            <DetailRow label='Descripción' value={item.descripcion ?? '—'} />
          </div>

          {(item.hashAnterior != null || item.hashRegistro != null) && (
            <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Link2 className='size-4 shrink-0' aria-hidden='true' />
                Cadena de integridad
              </div>
              <DetailRow
                label='Hash anterior'
                value={truncateHash(item.hashAnterior)}
                mono
                title={item.hashAnterior ?? undefined}
              />
              <DetailRow
                label='Hash registro'
                value={truncateHash(item.hashRegistro)}
                mono
                title={item.hashRegistro ?? undefined}
              />
            </div>
          )}

          {item.datosAdicionales != null && (
            <div className='space-y-2'>
              <p className='text-sm font-medium'>Datos adicionales</p>
              <pre className='max-h-64 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs break-all whitespace-pre-wrap'>
                {JSON.stringify(item.datosAdicionales, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

type DetailRowProps = {
  label: string
  value: string
  mono?: boolean
  title?: string
}

const DetailRow = ({ label, value, mono = false, title }: DetailRowProps) => {
  return (
    <div className='space-y-1.5'>
      <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
        {label}
      </p>
      <p
        className={
          mono
            ? 'rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs leading-relaxed break-all'
            : 'text-sm leading-relaxed break-words'
        }
        title={title ?? value}
      >
        {value}
      </p>
    </div>
  )
}
