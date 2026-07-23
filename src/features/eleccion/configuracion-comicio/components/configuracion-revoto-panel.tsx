import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Lock, RefreshCw } from 'lucide-react'
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
import {
  guardarConfiguracionRevotoSchema,
  type GuardarConfiguracionRevotoInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  useConfiguracionRevoto,
  useGuardarConfiguracionRevoto,
} from '@/features/eleccion/configuracion-comicio/hooks/use-configuracion-revoto'

type ConfiguracionRevotoPanelProps = {
  idEleccion: number
  isEditable: boolean
}

export const ConfiguracionRevotoPanel = ({
  idEleccion,
  isEditable,
}: ConfiguracionRevotoPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const configQuery = useConfiguracionRevoto(idEleccion)
  const guardarMutation = useGuardarConfiguracionRevoto(idEleccion)

  const form = useForm<GuardarConfiguracionRevotoInput>({
    resolver: zodResolver(guardarConfiguracionRevotoSchema),
    defaultValues: {
      permitirVotoMultiple: false,
      maxVotosPorVotante: 1,
    },
  })

  const permitirVotoMultiple = useWatch({
    control: form.control,
    name: 'permitirVotoMultiple',
  })
  const canEditForm = isEditable && (configQuery.data?.editable ?? false)

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      permitirVotoMultiple: configQuery.data.permitirVotoMultiple,
      maxVotosPorVotante: configQuery.data.maxVotosPorVotante,
    })
  }, [configQuery.data, form])

  useEffect(() => {
    if (!permitirVotoMultiple) {
      form.setValue('maxVotosPorVotante', 1)
      return
    }
    const currentMax = form.getValues('maxVotosPorVotante') ?? 1
    if (currentMax < 2) {
      form.setValue('maxVotosPorVotante', 2)
    }
  }, [permitirVotoMultiple, form])

  const handleSubmit = async (values: GuardarConfiguracionRevotoInput) => {
    const payload: GuardarConfiguracionRevotoInput = {
      permitirVotoMultiple: values.permitirVotoMultiple,
      ...(values.permitirVotoMultiple
        ? { maxVotosPorVotante: values.maxVotosPorVotante ?? 1 }
        : {}),
    }
    try {
      await guardarMutation.mutateAsync(payload)
      toast.success('Política de re-voto guardada')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const resumen =
    configQuery.data?.permitirVotoMultiple === true
      ? 'Re-voto habilitado (último voto cuenta)'
      : 'Re-voto deshabilitado (un sufragio por votante)'

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle className='flex items-center gap-2'>
          <RefreshCw className='size-5 text-primary' aria-hidden='true' />
          Política de re-voto
        </CardTitle>
        <CardDescription>
          {isOpen
            ? 'Permite que un votante emita más de un sufragio; solo el último se computa (LAST_VOTE_WINS).'
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
          <CardTitle>Política de re-voto</CardTitle>
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
                ? 'Ocultar configuración de re-voto'
                : 'Mostrar configuración de re-voto'
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
                  La política de re-voto no puede modificarse porque el comicio
                  ya no está en borrador. Al oficializar, esta configuración se
                  sella on-chain.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTitle>Impacto criptográfico</AlertTitle>
              <AlertDescription>
                Al oficializar el comicio, esta política se transfiere al smart
                contract y regula si un mismo votante puede sobrescribir su
                sufragio durante la ventana electoral.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='flex flex-col gap-6'
              >
                <FormField
                  control={form.control}
                  name='permitirVotoMultiple'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Permitir re-voto</FormLabel>
                        <FormDescription>
                          Mitiga coerción electoral permitiendo modificar el
                          sufragio mientras el comicio esté abierto.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEditForm}
                          aria-label='Permitir re-voto'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='maxVotosPorVotante'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de sufragios por votante</FormLabel>
                      <FormDescription>
                        {permitirVotoMultiple
                          ? 'Mínimo 2 sufragios: voto inicial y una modificación (VOTAR-324 ampliará este rango).'
                          : 'Deshabilitado mientras el re-voto esté inactivo.'}
                      </FormDescription>
                      <FormControl>
                        <Input
                          type='number'
                          min={permitirVotoMultiple ? 2 : 1}
                          max={permitirVotoMultiple ? 2 : 1}
                          value={field.value ?? (permitirVotoMultiple ? 2 : 1)}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                          disabled={!canEditForm || !permitirVotoMultiple}
                          aria-disabled={!canEditForm || !permitirVotoMultiple}
                          aria-label='Máximo de sufragios por votante'
                          className='max-w-[8rem]'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {canEditForm && (
                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={guardarMutation.isPending}
                      aria-label='Guardar política de re-voto'
                    >
                      {guardarMutation.isPending
                        ? 'Guardando…'
                        : 'Guardar política'}
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
