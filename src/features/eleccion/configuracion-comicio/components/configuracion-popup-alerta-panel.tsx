import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BellRing, ChevronDown, Lock } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  POPUP_ALERTA_DESCRIPCION_MAX_LENGTH,
  POPUP_ALERTA_TITULO_MAX_LENGTH,
} from '@/features/eleccion/configuracion-comicio/data/constants'
import {
  guardarPopupAlertaSchema,
  type GuardarPopupAlertaInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  useGuardarPopupAlerta,
  usePopupAlerta,
} from '@/features/eleccion/configuracion-comicio/hooks/use-popup-alerta'

type ConfiguracionPopupAlertaPanelProps = {
  idEleccion: number
}

export const ConfiguracionPopupAlertaPanel = ({
  idEleccion,
}: ConfiguracionPopupAlertaPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const configQuery = usePopupAlerta(idEleccion)
  const guardarMutation = useGuardarPopupAlerta(idEleccion)

  const form = useForm<GuardarPopupAlertaInput>({
    resolver: zodResolver(guardarPopupAlertaSchema),
    defaultValues: {
      habilitado: false,
      titulo: '',
      descripcion: '',
    },
  })

  const canEditForm = configQuery.data?.editable ?? false
  const habilitado = useWatch({ control: form.control, name: 'habilitado' })
  // El back solo guarda titulo y descripcion cuando habilitado es true.
  const canEditTexts = canEditForm && habilitado

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      habilitado: configQuery.data.habilitado,
      titulo: configQuery.data.titulo ?? '',
      descripcion: configQuery.data.descripcion ?? '',
    })
  }, [configQuery.data, form])

  const handleSubmit = async (values: GuardarPopupAlertaInput) => {
    try {
      await guardarMutation.mutateAsync(values)
      toast.success('Pop-up de alerta guardado')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const resumen = configQuery.data?.habilitado
    ? 'Pop-up habilitado: se muestra antes de comenzar a votar'
    : 'Pop-up deshabilitado'

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle className='flex items-center gap-2'>
          <BellRing className='size-5 text-primary' aria-hidden='true' />
          Pop-up de alerta
        </CardTitle>
        <CardDescription>
          {isOpen
            ? 'Configura una ventana de alerta que la Boleta Única Digital (BUD) muestra al votante antes de comenzar a votar.'
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
          <CardTitle>Pop-up de alerta</CardTitle>
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
                ? 'Ocultar configuración del pop-up de alerta'
                : 'Mostrar configuración del pop-up de alerta'
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
                  name='habilitado'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between gap-4'>
                      <div className='flex flex-col gap-1'>
                        <FormLabel>Habilitar pop-up de alerta</FormLabel>
                        <FormDescription>
                          Muestra una ventana de alerta al votante antes de
                          comenzar. El texto es público: puede leerlo cualquier
                          persona que conozca el comicio, aun sin iniciar
                          sesión.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEditForm}
                          aria-label='Habilitar pop-up de alerta'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='titulo'
                  render={({ field }) => {
                    const length = field.value.length
                    return (
                      <FormItem>
                        <div className='flex items-center justify-between gap-2'>
                          <FormLabel>Título del pop-up</FormLabel>
                          <span
                            className={cn(
                              'text-xs',
                              length > POPUP_ALERTA_TITULO_MAX_LENGTH
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {length} / {POPUP_ALERTA_TITULO_MAX_LENGTH}
                          </span>
                        </div>
                        <FormControl>
                          <Input disabled={!canEditTexts} {...field} />
                        </FormControl>
                        <FormDescription>
                          Se muestra en mayúsculas en la BUD.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                <FormField
                  control={form.control}
                  name='descripcion'
                  render={({ field }) => {
                    const length = field.value.length
                    return (
                      <FormItem>
                        <div className='flex items-center justify-between gap-2'>
                          <FormLabel>Descripción del pop-up</FormLabel>
                          <span
                            className={cn(
                              'text-xs',
                              length > POPUP_ALERTA_DESCRIPCION_MAX_LENGTH
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {length} / {POPUP_ALERTA_DESCRIPCION_MAX_LENGTH}
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            rows={4}
                            className='min-h-24 resize-y'
                            disabled={!canEditTexts}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Texto plano. Los saltos de línea se respetan.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {canEditForm && (
                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={guardarMutation.isPending}
                      aria-label='Guardar pop-up de alerta'
                    >
                      {guardarMutation.isPending
                        ? 'Guardando…'
                        : 'Guardar pop-up'}
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
