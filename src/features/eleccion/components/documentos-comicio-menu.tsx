import { ChevronDown, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { EleccionEstado } from '@/features/eleccion/data/schema'
import { useDocumentosComicio } from '@/features/eleccion/hooks/use-documentos-comicio'
import { obtenerDocumentosDisponibles } from '@/features/eleccion/lib/documentos-comicio'

type DocumentosComicioMenuProps = {
  idEleccion: number
  estado: EleccionEstado
}

/**
 * Menú único para todos los documentos oficiales descargables de un
 * comicio (VOTAR-374). Reemplaza el patrón "un botón por documento": hoy
 * solo lista el Acta de Apertura, pero agregar la futura Acta de Cierre no
 * requiere tocar este componente (ver `documentos-comicio.ts`).
 */
export const DocumentosComicioMenu = ({
  idEleccion,
  estado,
}: DocumentosComicioMenuProps) => {
  const documentos = obtenerDocumentosDisponibles(estado)
  const mutations = useDocumentosComicio()

  if (documentos.length === 0) {
    return null
  }

  const hayGeneracionEnCurso = documentos.some(
    (documento) => mutations[documento.id].isPending
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          disabled={hayGeneracionEnCurso}
          aria-label='Actas oficiales'
        >
          {hayGeneracionEnCurso ? (
            <Loader2 className='me-2 size-4 animate-spin' />
          ) : (
            <FileText className='me-2 size-4' />
          )}
          Actas oficiales
          <ChevronDown className='ms-2 size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {documentos.map((documento) => {
          const mutation = mutations[documento.id]
          return (
            <DropdownMenuItem
              key={documento.id}
              disabled={mutation.isPending}
              onSelect={() => mutation.mutate(idEleccion)}
            >
              <FileText className='size-4' />
              {mutation.isPending ? 'Generando…' : documento.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
