import { FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AuditLogEmptyStateProps = {
  onClearFilters: () => void
}

export const AuditLogEmptyState = ({
  onClearFilters,
}: AuditLogEmptyStateProps) => {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
      <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
        <FileSearch
          className='size-6 text-muted-foreground'
          aria-hidden='true'
        />
      </div>
      <div className='space-y-1'>
        <p className='font-medium'>No hay entradas que coincidan</p>
        <p className='max-w-md text-sm text-muted-foreground'>
          Probá ajustar los filtros o ampliar el rango temporal de búsqueda.
        </p>
      </div>
      <Button type='button' variant='outline' onClick={onClearFilters}>
        Limpiar filtros
      </Button>
    </div>
  )
}
