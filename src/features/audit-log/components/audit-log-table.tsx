import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { formatDateTime24ForDisplay } from '@/lib/datetime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AuditLogEmptyState } from '@/features/audit-log/components/audit-log-empty-state'
import {
  AUDIT_PAGE_SIZES,
  getAuditEventLabel,
} from '@/features/audit-log/data/event-labels'
import type { AuditLogItem } from '@/features/audit-log/data/schema'
import { truncateHash } from '@/features/audit-log/lib/format-audit-log'

type AuditLogTableProps = {
  items: AuditLogItem[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onViewDetail: (item: AuditLogItem) => void
  onClearFilters: () => void
}

export const AuditLogTable = ({
  items,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onClearFilters,
}: AuditLogTableProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-12 w-full' />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <AuditLogEmptyState onClearFilters={onClearFilters} />
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-lg border'>
        <Table className='min-w-[880px] table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[148px]'>Fecha y hora</TableHead>
              <TableHead className='w-[148px]'>Tipo</TableHead>
              <TableHead className='w-[132px]'>Operador</TableHead>
              <TableHead className='w-[132px]'>Terminal</TableHead>
              <TableHead className='min-w-[160px]'>Descripción</TableHead>
              <TableHead className='w-[88px]'>Comicio</TableHead>
              <TableHead className='w-[56px]'>
                <span className='sr-only'>Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const eventLabel = getAuditEventLabel(item.tipoEvento)
              return (
                <TableRow key={item.idLog}>
                  <TableCell className='text-xs whitespace-nowrap sm:text-sm'>
                    {formatDateTime24ForDisplay(item.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={eventLabel.variant}
                      className='max-w-full truncate'
                    >
                      {eventLabel.label}
                    </Badge>
                  </TableCell>
                  <TableCell className='max-w-0'>
                    <span
                      className='block truncate font-mono text-xs'
                      title={item.actor}
                      aria-label={`ID ofuscado del operador ${item.actor}`}
                    >
                      {truncateHash(item.actor)}
                    </span>
                  </TableCell>
                  <TableCell className='max-w-0'>
                    <span
                      className='block truncate font-mono text-xs'
                      title={item.identificadorTerminal ?? undefined}
                      aria-label={
                        item.identificadorTerminal != null
                          ? `Terminal criptográfico ${item.identificadorTerminal}`
                          : 'Sin terminal'
                      }
                    >
                      {truncateHash(item.identificadorTerminal)}
                    </span>
                  </TableCell>
                  <TableCell className='max-w-0'>
                    <span
                      className='block truncate text-sm'
                      title={item.descripcion ?? undefined}
                    >
                      {item.descripcion ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className='text-sm whitespace-nowrap'>
                    {item.idEleccion != null ? `#${item.idEleccion}` : 'Global'}
                  </TableCell>
                  <TableCell>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => onViewDetail(item)}
                      aria-label={`Ver detalle del evento ${item.idLog}`}
                    >
                      <Eye className='size-4' aria-hidden='true' />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          {total.toLocaleString('es-AR')} registro
          {total === 1 ? '' : 's'} · Página {page} de {totalPages}
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className='w-[120px]' aria-label='Tamaño de página'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='button'
            variant='outline'
            size='icon'
            disabled={!canGoPrev}
            onClick={() => onPageChange(page - 1)}
            aria-label='Página anterior'
          >
            <ChevronLeft className='size-4' aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon'
            disabled={!canGoNext}
            onClick={() => onPageChange(page + 1)}
            aria-label='Página siguiente'
          >
            <ChevronRight className='size-4' aria-hidden='true' />
          </Button>
        </div>
      </div>
    </div>
  )
}
