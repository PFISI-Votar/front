import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { AuthBloqueoAlcance } from '@/features/configuracion-sistema/data/schema'
import { useConfiguracionSistema } from '@/features/configuracion-sistema/hooks/use-configuracion-sistema'
import {
  useActualizarAuthBloqueo,
  useRevocarSesionesUsuario,
  useRevocarTodasLasSesiones,
} from '@/features/configuracion-sistema/hooks/use-sesiones-activas'

const CONFIRMACION_GLOBAL = 'REVOCAR_TODAS_LAS_SESIONES'

const revocarUsuarioSchema = z.object({
  identificadorSso: z.string().min(1, 'Ingrese el identificador SSO.'),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres.'),
})

const revocarTodasSchema = z.object({
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres.'),
})

export function ContencionIncidentesCard() {
  const { data: config } = useConfiguracionSistema()
  const revocarUsuario = useRevocarSesionesUsuario()
  const revocarTodas = useRevocarTodasLasSesiones()
  const actualizarBloqueo = useActualizarAuthBloqueo()

  const [confirmUsuarioOpen, setConfirmUsuarioOpen] = useState(false)
  const [confirmGlobalOpen, setConfirmGlobalOpen] = useState(false)
  const [confirmGlobalText, setConfirmGlobalText] = useState('')
  const [preservarActual, setPreservarActual] = useState(true)

  const [alcance, setAlcance] = useState<AuthBloqueoAlcance>('ADMIN')
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [confirmBloqueoOpen, setConfirmBloqueoOpen] = useState(false)

  const usuarioForm = useForm<z.infer<typeof revocarUsuarioSchema>>({
    resolver: zodResolver(revocarUsuarioSchema),
    defaultValues: { identificadorSso: '', motivo: '' },
  })
  const todasForm = useForm<z.infer<typeof revocarTodasSchema>>({
    resolver: zodResolver(revocarTodasSchema),
    defaultValues: { motivo: '' },
  })

  const alcanceActual = config?.authBloqueoAlcance ?? 'NINGUNO'
  const bloqueoActivo = alcanceActual !== 'NINGUNO'

  const handleRevocarUsuario = usuarioForm.handleSubmit(() => {
    setConfirmUsuarioOpen(true)
  })

  const confirmarRevocarUsuario = () => {
    revocarUsuario.mutate(usuarioForm.getValues(), {
      onSuccess: () => usuarioForm.reset({ identificadorSso: '', motivo: '' }),
    })
    setConfirmUsuarioOpen(false)
  }

  const handleRevocarTodas = todasForm.handleSubmit(() => {
    setConfirmGlobalText('')
    setConfirmGlobalOpen(true)
  })

  const confirmarRevocarTodas = () => {
    revocarTodas.mutate(
      {
        motivo: todasForm.getValues('motivo'),
        preservarSesionActual: preservarActual,
      },
      { onSuccess: () => todasForm.reset({ motivo: '' }) }
    )
    setConfirmGlobalOpen(false)
  }

  const aplicarBloqueo = () => {
    if (alcance === 'TODOS') {
      setConfirmBloqueoOpen(true)
      return
    }
    actualizarBloqueo.mutate({
      alcance,
      motivo: alcance === 'NINGUNO' ? undefined : motivoBloqueo,
    })
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-3'>
        <ShieldX className='size-5 text-destructive' aria-hidden='true' />
        <p className='text-sm font-medium'>Contención de incidentes</p>
      </div>

      {/* Revocar sesiones de un usuario */}
      <Form {...usuarioForm}>
        <form onSubmit={handleRevocarUsuario} className='space-y-4'>
          <FormField
            control={usuarioForm.control}
            name='identificadorSso'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revocar sesiones de un usuario</FormLabel>
                <FormControl>
                  <Input placeholder='Identificador SSO' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={usuarioForm.control}
            name='motivo'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    aria-label='Motivo de revocación por usuario'
                    placeholder='Motivo (mín. 10 caracteres) — queda en la bitácora'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            variant='destructive'
            disabled={revocarUsuario.isPending}
          >
            {revocarUsuario.isPending ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : null}
            Revocar sesiones del usuario
          </Button>
        </form>
      </Form>

      {/* Revocación global */}
      <Form {...todasForm}>
        <form onSubmit={handleRevocarTodas} className='space-y-4'>
          <FormField
            control={todasForm.control}
            name='motivo'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revocación global de sesiones</FormLabel>
                <FormControl>
                  <Textarea
                    aria-label='Motivo de revocación global'
                    placeholder='Motivo (mín. 10 caracteres)'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Cierra todas las sesiones activas. Con la opción marcada, la
                  suya se mantiene para poder revertir.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={preservarActual}
              onChange={(e) => setPreservarActual(e.target.checked)}
            />
            Preservar mi sesión actual
          </label>
          <Button
            type='submit'
            variant='destructive'
            disabled={revocarTodas.isPending}
          >
            {revocarTodas.isPending ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : null}
            Revocar TODAS las sesiones
          </Button>
        </form>
      </Form>

      {/* Bloqueo de flujos de autenticación */}
      <div className='space-y-4'>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>
            Bloqueo de autenticación institucional
          </p>
          <p className='text-sm text-muted-foreground'>
            Estado actual:{' '}
            <Badge variant={bloqueoActivo ? 'destructive' : 'secondary'}>
              {alcanceActual}
            </Badge>
            {config?.authBloqueoDesde ? (
              <span className='ml-2'>
                desde {new Date(config.authBloqueoDesde).toLocaleString()}
              </span>
            ) : null}
          </p>
        </div>

        <div className='grid gap-3 sm:max-w-xs'>
          <Label htmlFor='alcance-bloqueo'>Alcance</Label>
          <Select
            value={alcance}
            onValueChange={(v) => setAlcance(v as AuthBloqueoAlcance)}
          >
            <SelectTrigger id='alcance-bloqueo'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='NINGUNO'>
                NINGUNO (operación normal)
              </SelectItem>
              <SelectItem value='ADMIN'>
                ADMIN (corta login de autoridades)
              </SelectItem>
              <SelectItem value='TODOS'>
                TODOS (agrega el login de votantes)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {alcance !== 'NINGUNO' ? (
          <Textarea
            placeholder='Motivo del bloqueo (mín. 10 caracteres)'
            value={motivoBloqueo}
            onChange={(e) => setMotivoBloqueo(e.target.value)}
            className='sm:max-w-md'
          />
        ) : null}

        <Button
          variant={alcance === 'NINGUNO' ? 'outline' : 'destructive'}
          disabled={
            actualizarBloqueo.isPending ||
            (alcance !== 'NINGUNO' && motivoBloqueo.trim().length < 10)
          }
          onClick={aplicarBloqueo}
        >
          {actualizarBloqueo.isPending ? (
            <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          ) : null}
          {alcance === 'NINGUNO'
            ? 'Desactivar bloqueo'
            : 'Aplicar bloqueo de autenticación'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmUsuarioOpen}
        onOpenChange={setConfirmUsuarioOpen}
        title='Revocar sesiones del usuario'
        desc={`Se cerrarán todas las sesiones activas de "${usuarioForm.getValues(
          'identificadorSso'
        )}". Deberá volver a autenticarse.`}
        destructive
        confirmText='Revocar'
        handleConfirm={confirmarRevocarUsuario}
      />

      <ConfirmDialog
        open={confirmGlobalOpen}
        onOpenChange={setConfirmGlobalOpen}
        title='Revocación global de sesiones'
        desc={
          <span>
            Esto cierra <strong>todas</strong> las sesiones de autoridad
            electoral. Escriba <code>{CONFIRMACION_GLOBAL}</code> para
            confirmar.
          </span>
        }
        destructive
        confirmText='Revocar todas'
        disabled={confirmGlobalText !== CONFIRMACION_GLOBAL}
        handleConfirm={confirmarRevocarTodas}
      >
        <Input
          value={confirmGlobalText}
          onChange={(e) => setConfirmGlobalText(e.target.value)}
          placeholder={CONFIRMACION_GLOBAL}
          aria-label='Texto de confirmación'
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmBloqueoOpen}
        onOpenChange={setConfirmBloqueoOpen}
        title='Bloquear TODOS los flujos de autenticación'
        desc='El alcance TODOS también detiene el ingreso de votantes al comicio. Úselo solo ante un incidente que lo amerite.'
        destructive
        confirmText='Bloquear todo'
        handleConfirm={() => {
          actualizarBloqueo.mutate({ alcance: 'TODOS', motivo: motivoBloqueo })
          setConfirmBloqueoOpen(false)
        }}
      />
    </div>
  )
}
