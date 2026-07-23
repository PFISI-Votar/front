import { useState } from 'react'
import {
  Braces,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Table,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  ESCRUTINIO_EXPORT_FORMAT_LABELS,
  type EscrutinioExportFormat,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export.types'
import {
  exportEscrutinio,
  puedeExportarEscrutinio,
} from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio'

const EXPORT_FORMATS: EscrutinioExportFormat[] = ['xlsx', 'pdf', 'csv', 'json']

const EXPORT_FORMAT_ICONS: Record<EscrutinioExportFormat, LucideIcon> = {
  xlsx: FileSpreadsheet,
  pdf: FileText,
  csv: Table,
  json: Braces,
}

type EscrutinioExportMenuProps = {
  escrutinio: Escrutinio
  disabled?: boolean
}

export const EscrutinioExportMenu = ({
  escrutinio,
  disabled = false,
}: EscrutinioExportMenuProps) => {
  const [exportingFormat, setExportingFormat] =
    useState<EscrutinioExportFormat | null>(null)
  const canExport = puedeExportarEscrutinio(escrutinio.estado)
  if (!canExport) {
    return null
  }
  const isBusy = exportingFormat !== null
  const handleExport = async (
    formato: EscrutinioExportFormat
  ): Promise<void> => {
    if (isBusy || disabled) {
      return
    }
    setExportingFormat(formato)
    try {
      await exportEscrutinio(formato, escrutinio)
    } finally {
      setExportingFormat(null)
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || isBusy}
          aria-busy={isBusy}
          aria-label='Exportar resultados del escrutinio'
          className='rounded-xl border-[#c5d8e8] bg-white/95 text-[#2f6f9f] shadow-sm hover:bg-[#2f6f9f]/5'
        >
          {isBusy ? (
            <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          ) : (
            <Download className='size-4' aria-hidden='true' />
          )}
          Exportar resultados
          <ChevronDown className='size-4 opacity-70' aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='min-w-56 rounded-xl border-[#e4e7eb] bg-white/98 p-1 shadow-[0_1rem_3rem_rgba(30,64,95,0.12)]'
      >
        {EXPORT_FORMATS.map((formato) => {
          const FormatIcon = EXPORT_FORMAT_ICONS[formato]
          return (
            <DropdownMenuItem
              key={formato}
              role='menuitem'
              disabled={isBusy}
              className='cursor-pointer rounded-lg text-sm text-[#202124] focus:bg-[#2f6f9f]/10 focus:text-[#2f6f9f]'
              onSelect={() => {
                void handleExport(formato)
              }}
            >
              {exportingFormat === formato ? (
                <Loader2
                  className='me-2 size-4 animate-spin text-[#2f6f9f]'
                  aria-hidden='true'
                />
              ) : (
                <FormatIcon
                  className='me-2 size-4 text-[#2f6f9f]'
                  aria-hidden='true'
                />
              )}
              {ESCRUTINIO_EXPORT_FORMAT_LABELS[formato]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
