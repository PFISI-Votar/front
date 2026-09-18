import { Loader2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useCerrarOtrasSesiones,
  useSesionesActivas,
} from '@/features/configuracion-sistema/hooks/use-sesiones-activas'

const formatoRelativo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.round(diffMs / 60000)
  if (minutos < 1) return 'hace instantes'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return new Date(iso).toLocaleDateString()
}

export function SesionesActivasCard() {
  const { data: sesiones, isLoading, isError } = useSesionesActivas()
  const cerrarOtras = useCerrarOtrasSesiones()

  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-3'>
        <Users className='mt-0.5 size-5 text-[#2f6f9f]' aria-hidden='true' />
        <div className='space-y-1'>
          <p className='text-sm font-medium'>Sesiones activas</p>
          <p className='text-sm text-muted-foreground'>
            Sesiones de autoridad electoral vigentes. Cerrar una sesión corta el
            acceso de inmediato, sin esperar a que caduque el token.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className='text-sm text-muted-foreground'>Consultando sesiones…</p>
      ) : isError ? (
        <p className='text-sm text-destructive'>
          No se pudieron obtener las sesiones activas.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-lg border border-border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>SSO</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead>Expira</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sesiones ?? []).map((sesion) => (
                <TableRow key={sesion.idSession}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <span>{sesion.nombre ?? sesion.email ?? sesion.sub}</span>
                      {sesion.actual ? (
                        <Badge variant='secondary'>Esta sesión</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{sesion.identificadorSso}</TableCell>
                  <TableCell>
                    {formatoRelativo(sesion.lastActivityAt)}
                  </TableCell>
                  <TableCell>
                    {new Date(sesion.expiresAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {(sesiones ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center text-muted-foreground'
                  >
                    No hay sesiones activas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <Button
        variant='outline'
        disabled={cerrarOtras.isPending}
        onClick={() => cerrarOtras.mutate()}
      >
        {cerrarOtras.isPending ? (
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
        ) : null}
        Cerrar mis otras sesiones
      </Button>
    </div>
  )
}
