import { FilterX, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/datetime-picker'
import { AuditLogEventTypeFilter } from '@/features/audit-log/components/audit-log-event-type-filter'
import { CRITICAL_EVENT_TYPES } from '@/features/audit-log/data/event-labels'
import type {
  NivelEventoAudit,
  ResultadoEventoAudit,
} from '@/features/audit-log/data/schema'
import type { AuditLogToolbarDraft } from '@/features/audit-log/lib/audit-log-search-state'

type AuditLogToolbarProps = {
  draft: AuditLogToolbarDraft
  onDraftChange: (draft: AuditLogToolbarDraft) => void
  onApply: () => void
  onClear: () => void
  idEleccionFijo?: number
  elecciones?: { idEleccion: number; nombre: string }[]
}

export const AuditLogToolbar = ({
  draft,
  onDraftChange,
  onApply,
  onClear,
  idEleccionFijo,
  elecciones = [],
}: AuditLogToolbarProps) => {
  const handleFieldChange = <K extends keyof AuditLogToolbarDraft>(
    key: K,
    value: AuditLogToolbarDraft[K]
  ): void => {
    onDraftChange({ ...draft, [key]: value })
  }

  const handleApplyCriticalPreset = (): void => {
    onDraftChange({
      ...draft,
      tipoEvento: [...CRITICAL_EVENT_TYPES],
      nivel: 'ERROR',
    })
  }

  return (
    <div className='space-y-4 rounded-lg border bg-card p-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <AuditLogEventTypeFilter
          selected={draft.tipoEvento}
          onChange={(values) => handleFieldChange('tipoEvento', values)}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-9'
          onClick={handleApplyCriticalPreset}
          aria-label='Aplicar preset de eventos críticos'
        >
          <ShieldAlert className='me-2 size-4' aria-hidden='true' />
          Eventos críticos
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {idEleccionFijo == null && (
          <div className='space-y-2'>
            <Label htmlFor='audit-comicio'>Comicio</Label>
            <Select
              value={draft.idEleccion || 'all'}
              onValueChange={(value) =>
                handleFieldChange('idEleccion', value === 'all' ? '' : value)
              }
            >
              <SelectTrigger id='audit-comicio' className='w-full'>
                <SelectValue placeholder='Todos los comicios' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los comicios</SelectItem>
                {elecciones.map((eleccion) => (
                  <SelectItem
                    key={eleccion.idEleccion}
                    value={String(eleccion.idEleccion)}
                  >
                    {eleccion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='audit-actor'>ID ofuscado del operador</Label>
          <Input
            id='audit-actor'
            value={draft.actor}
            onChange={(event) => handleFieldChange('actor', event.target.value)}
            placeholder='Hash SHA-256 (64 hex)'
            aria-label='ID ofuscado del operador'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-terminal'>Terminal criptográfico</Label>
          <Input
            id='audit-terminal'
            value={draft.terminal}
            onChange={(event) =>
              handleFieldChange('terminal', event.target.value)
            }
            placeholder='Hash o IP (se ofusca en servidor)'
            aria-label='Terminal criptográfico'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-endpoint'>Endpoint</Label>
          <Input
            id='audit-endpoint'
            value={draft.endpoint}
            onChange={(event) =>
              handleFieldChange('endpoint', event.target.value)
            }
            placeholder='/padron/import'
            aria-label='Endpoint'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-q'>Búsqueda en descripción</Label>
          <Input
            id='audit-q'
            value={draft.q}
            onChange={(event) => handleFieldChange('q', event.target.value)}
            placeholder='Texto libre…'
            aria-label='Búsqueda en descripción'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-nivel'>Nivel</Label>
          <Select
            value={draft.nivel || 'all'}
            onValueChange={(value) =>
              handleFieldChange(
                'nivel',
                value === 'all' ? '' : (value as NivelEventoAudit)
              )
            }
          >
            <SelectTrigger id='audit-nivel' className='w-full'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='INFO'>INFO</SelectItem>
              <SelectItem value='ERROR'>ERROR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-resultado'>Resultado</Label>
          <Select
            value={draft.resultado || 'all'}
            onValueChange={(value) =>
              handleFieldChange(
                'resultado',
                value === 'all' ? '' : (value as ResultadoEventoAudit)
              )
            }
          >
            <SelectTrigger id='audit-resultado' className='w-full'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='EXITOSO'>Exitoso</SelectItem>
              <SelectItem value='RECHAZADO'>Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-desde'>Desde</Label>
          <DateTimePicker
            id='audit-desde'
            value={draft.desde}
            onChange={(value) => handleFieldChange('desde', value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='audit-hasta'>Hasta</Label>
          <DateTimePicker
            id='audit-hasta'
            value={draft.hasta}
            onChange={(value) => handleFieldChange('hasta', value)}
          />
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button type='button' onClick={onApply} aria-label='Buscar registros'>
          <Search className='me-2 size-4' aria-hidden='true' />
          Buscar
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={onClear}
          aria-label='Limpiar filtros'
        >
          <FilterX className='me-2 size-4' aria-hidden='true' />
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}
