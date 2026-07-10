import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  etiquetaCampo,
  generarFilasEjemplo,
  normalizarCamposSeleccionados,
  type ClaveCampoPadron,
} from '../lib/campos-padron'

interface PadronEjemploTablaProps {
  campos: ClaveCampoPadron[]
}

/**
 * Guía visual con 5 filas de ejemplo según los campos seleccionados (VOTAR-417).
 */
export function PadronEjemploTabla({ campos }: PadronEjemploTablaProps) {
  const ordenados = normalizarCamposSeleccionados(campos)
  const filas = generarFilasEjemplo(ordenados)

  return (
    <div className='space-y-2 rounded-lg border bg-muted/30 p-3'>
      <div>
        <p className='text-sm font-medium'>Formato esperado</p>
        <p className='text-xs text-muted-foreground'>
          Una persona por fila. La primera fila debe ser la cabecera con estos
          nombres de columna (sin acentos, en minúsculas).
        </p>
      </div>
      <div className='overflow-x-auto rounded-md border bg-background'>
        <Table>
          <TableHeader>
            <TableRow>
              {ordenados.map((clave) => (
                <TableHead key={clave} className='font-mono text-xs'>
                  {clave}
                  <span className='ml-1 font-sans text-muted-foreground'>
                    ({etiquetaCampo(clave)})
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila, idx) => (
              <TableRow key={idx}>
                {ordenados.map((clave) => (
                  <TableCell key={clave} className='font-mono text-xs'>
                    {fila[clave]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
