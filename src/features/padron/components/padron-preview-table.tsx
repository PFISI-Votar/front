import { useMemo, useState } from 'react'
import { Loader2, Trash2, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useImportarPadron,
  type ImportarPadronResponse,
} from '../hooks/use-importar-padron'
import { PADRON_PAGE_SIZES } from '../hooks/use-padron'
import {
  etiquetaCampo,
  type CampoPadronDefinicion,
  type ClaveCampoPadron,
} from '../lib/campos-padron'
import type {
  RegistroPreview,
  TipoNovedadPreview,
} from '../lib/parse-csv-padron'
import { construirArchivoCsv } from '../lib/reconstruir-csv'
import { contarProblemas, validarRegistros } from '../lib/validar-padron'

interface PadronPreviewTableProps {
  idEleccion: number
  registrosIniciales: RegistroPreview[]
  campos: ClaveCampoPadron[]
  definiciones: CampoPadronDefinicion[]
  onConfirmado: (resultado: ImportarPadronResponse) => void
  onCancelar: () => void
}

const ETIQUETA: Record<TipoNovedadPreview, string> = {
  OK: 'OK',
  DNI_AUSENTE: 'DNI ausente',
  EMAIL_AUSENTE: 'Email ausente',
  DNI_INVALIDO: 'DNI inválido',
  EMAIL_INVALIDO: 'Email inválido',
  DUPLICADO: 'Duplicado',
}

export function PadronPreviewTable({
  idEleccion,
  registrosIniciales,
  campos,
  definiciones,
  onConfirmado,
  onCancelar,
}: PadronPreviewTableProps) {
  const [registros, setRegistros] = useState(registrosIniciales)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const importar = useImportarPadron()

  const estados = useMemo(() => validarRegistros(registros), [registros])
  const problemas = contarProblemas(estados)
  const totalPaginas = Math.max(1, Math.ceil(registros.length / limit))
  const visibles = registros.slice((page - 1) * limit, page * limit)
  const muestraDni = campos.includes('dni')
  const muestraEmail = campos.includes('email')
  const columnasExtra = campos.filter((c) => c !== 'dni' && c !== 'email')

  const editar = (id: string, campo: 'dni' | 'email', valor: string) =>
    setRegistros((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r))
    )

  const borrar = (id: string) =>
    setRegistros((prev) => prev.filter((r) => r.id !== id))

  const confirmar = () => {
    importar.mutate(
      { idEleccion, archivo: construirArchivoCsv(registros) },
      { onSuccess: onConfirmado }
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm'>
          <span className='font-medium'>{registros.length} registros</span> ·{' '}
          <span
            className={
              problemas > 0 ? 'text-amber-600' : 'text-muted-foreground'
            }
          >
            {problemas} con problemas
          </span>
        </p>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={onCancelar}>
            <X className='size-4' />
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={registros.length === 0 || importar.isPending}
          >
            {importar.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Upload className='size-4' />
            )}
            Confirmar e importar
          </Button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-20'>Línea</TableHead>
              {muestraDni && <TableHead>DNI</TableHead>}
              {muestraEmail && <TableHead>Email</TableHead>}
              {columnasExtra.map((clave) => (
                <TableHead key={clave}>
                  {etiquetaCampo(clave, definiciones)}
                </TableHead>
              ))}
              <TableHead className='w-32'>Estado</TableHead>
              <TableHead className='w-16' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='font-mono'>{r.linea}</TableCell>
                {muestraDni && (
                  <TableCell>
                    <Input
                      aria-label={`DNI línea ${r.linea}`}
                      value={r.dni}
                      onChange={(e) => editar(r.id, 'dni', e.target.value)}
                    />
                  </TableCell>
                )}
                {muestraEmail && (
                  <TableCell>
                    <Input
                      aria-label={`Email línea ${r.linea}`}
                      value={r.email}
                      onChange={(e) => editar(r.id, 'email', e.target.value)}
                    />
                  </TableCell>
                )}
                {columnasExtra.map((clave) => (
                  <TableCell key={clave} className='text-muted-foreground'>
                    {r.adicionales?.[clave] ?? ''}
                  </TableCell>
                ))}
                <TableCell>
                  <Badge
                    variant={
                      estados[r.id] === 'OK' ? 'secondary' : 'destructive'
                    }
                  >
                    {ETIQUETA[estados[r.id]]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={`Borrar fila ${r.linea}`}
                    onClick={() => borrar(r.id)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            Filas por página
          </span>
          <Select
            value={limit.toString()}
            onValueChange={(v) => {
              setLimit(Number(v))
              setPage(1)
            }}
          >
            <SelectTrigger size='sm' className='w-20'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PADRON_PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={s.toString()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            Página {page} de {totalPaginas}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
