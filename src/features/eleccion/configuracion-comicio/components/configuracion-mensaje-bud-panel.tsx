import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Lock, MessageSquareText, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  guardarMensajeBudSchema,
  type GuardarMensajeBudInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  useGuardarMensajeBud,
  useMensajeBud,
} from '@/features/eleccion/configuracion-comicio/hooks/use-mensaje-bud'
import { DEFAULT_BUD_LOGIN_OBSERVACION } from '@/features/voto/components/bud-login-screen'

type ConfiguracionMensajeBudPanelProps = {
  idEleccion: number
}

export const ConfiguracionMensajeBudPanel = ({
  idEleccion,
}: ConfiguracionMensajeBudPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const configQuery = useMensajeBud(idEleccion)
  const guardarMutation = useGuardarMensajeBud(idEleccion)

  const form = useForm<GuardarMensajeBudInput>({
    resolver: zodResolver(guardarMensajeBudSchema),
    defaultValues: {
      observacionLogin: '',
    },
  })

  const canEditForm = configQuery.data?.editable ?? true

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      observacionLogin: configQuery.data.observacionLogin ?? '',
    })
  }, [configQuery.data, form])

  const handleSubmit = async (values: GuardarMensajeBudInput) => {
    try {
      await guardarMutation.mutateAsync(values)
      toast.success('Mensaje del login del BUD guardado')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleRestablecerDefault = () => {
    form.setValue('observacionLogin', DEFAULT_BUD_LOGIN_OBSERVACION, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const observacionActual = configQuery.data?.observacionLogin
  const resumen =
    observacionActual === null
      ? 'Sin mensaje informativo (recuadro oculto)'
      : observacionActual === DEFAULT_BUD_LOGIN_OBSERVACION ||
          observacionActual === undefined
        ? 'Mensaje institucional por defecto'
        : 'Mensaje personalizado activo'

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle className='flex items-center gap-2'>
          <MessageSquareText
            className='size-5 text-primary'
            aria-hidden='true'
          />
          Mensaje en el login del BUD
        </CardTitle>
        <CardDescription>
          {isOpen
            ? 'Configura el texto institucional mostrado a los votantes en la pantalla de inicio de sesión de la Boleta Única Digital (BUD). Se puede actualizar en cualquier momento.'
            : resumen}
        </CardDescription>
      </div>
      <ChevronDown
        className={cn(
          'mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
        aria-hidden='true'
      />
    </CardHeader>
  )

  if (configQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mensaje en el login del BUD</CardTitle>
          <CardDescription>Cargando configuración…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='w-full rounded-t-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? 'Ocultar configuración de mensaje del BUD'
                : 'Mostrar configuración de mensaje del BUD'
            }
          >
            {cardHeader}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className='flex flex-col gap-4 border-t pt-6'>
            {!canEditForm && (
              <Alert>
                <Lock className='size-4' />
                <AlertTitle>Solo lectura</AlertTitle>
                <AlertDescription>
                  El comicio está archivado y no admite modificaciones.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='flex flex-col gap-6'
              >
                <FormField
                  control={form.control}
                  name='observacionLogin'
                  render={({ field }) => {
                    const length = field.value?.length ?? 0
                    return (
                      <FormItem>
                        <div className='flex items-center justify-between gap-2'>
                          <FormLabel>Mensaje para los votantes</FormLabel>
                          <span
                            className={cn(
                              'text-xs',
                              length > 1000
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {length} / 1000
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            rows={3}
                            className='min-h-24 resize-y'
                            placeholder={DEFAULT_BUD_LOGIN_OBSERVACION}
                            disabled={!canEditForm}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Si se deja en blanco o se limpia, se ocultará el
                          recuadro informativo en el login del BUD.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {canEditForm && (
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleRestablecerDefault}
                      disabled={guardarMutation.isPending}
                    >
                      <RotateCcw className='me-2 size-3.5' />
                      Restablecer texto por defecto
                    </Button>
                    <Button
                      type='submit'
                      disabled={guardarMutation.isPending}
                      aria-label='Guardar mensaje del login del BUD'
                    >
                      {guardarMutation.isPending
                        ? 'Guardando…'
                        : 'Guardar mensaje'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
