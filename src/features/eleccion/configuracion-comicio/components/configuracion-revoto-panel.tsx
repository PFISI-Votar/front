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
import {
  MAX_INTERVALO_SEGUNDOS,
  MAX_SUFRAGIOS_POR_VOTANTE,
} from '@/features/eleccion/configuracion-comicio/data/constants'
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
      minIntervaloSegundos: 0,
    },
  })

  const maxVotosPorVotante = useWatch({
    control: form.control,
    name: 'maxVotosPorVotante',
  })
  const permitirVotoMultiple = useWatch({
    control: form.control,
    name: 'permitirVotoMultiple',
  })
  const canEditForm = isEditable && (configQuery.data?.editable ?? false)
  const canEditIntervalo = canEditForm && permitirVotoMultiple

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      permitirVotoMultiple: configQuery.data.permitirVotoMultiple,
      maxVotosPorVotante: configQuery.data.maxVotosPorVotante,
      minIntervaloSegundos: configQuery.data.minIntervaloSegundos,
    })
  }, [configQuery.data, form])

  // VOTAR-324: el número es la única entrada del usuario; permitirVotoMultiple
  // se deriva (1 = off, 2..10 = on) en vez de exponer un switch aparte.
  useEffect(() => {
    const enabled = (maxVotosPorVotante ?? 1) >= 2
    if (form.getValues('permitirVotoMultiple') !== enabled) {
      form.setValue('permitirVotoMultiple', enabled)
    }
  }, [maxVotosPorVotante, form])

  const handleSubmit = async (values: GuardarConfiguracionRevotoInput) => {
    const payload: GuardarConfiguracionRevotoInput = {
      permitirVotoMultiple: values.permitirVotoMultiple,
      ...(values.permitirVotoMultiple
        ? {
            maxVotosPorVotante: values.maxVotosPorVotante ?? 2,
            minIntervaloSegundos: values.minIntervaloSegundos ?? 0,
          }
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

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='flex flex-col gap-6'
              >
                <FormField
                  control={form.control}
                  name='maxVotosPorVotante'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de sufragios por votante</FormLabel>
                      <FormDescription>
                        {`1 deshabilita el re-voto. Entre 2 y ${MAX_SUFRAGIOS_POR_VOTANTE} lo habilita (solo el último sufragio se computa).`}
                      </FormDescription>
                      <FormControl>
                        <Input
                          type='number'
                          min={1}
                          max={MAX_SUFRAGIOS_POR_VOTANTE}
                          value={field.value ?? 1}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                          disabled={!canEditForm}
                          aria-disabled={!canEditForm}
                          aria-label='Máximo de sufragios por votante'
                          className='max-w-[8rem]'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='minIntervaloSegundos'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Intervalo mínimo entre sufragios (segundos)
                      </FormLabel>
                      <FormDescription>
                        {`Tiempo mínimo que debe esperar un votante antes de volver a sufragar (mitiga coerción por "voto en cadena"). 0 deshabilita la espera, máximo ${MAX_INTERVALO_SEGUNDOS}.`}
                      </FormDescription>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          max={MAX_INTERVALO_SEGUNDOS}
                          value={field.value ?? 0}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                          disabled={!canEditIntervalo}
                          aria-disabled={!canEditIntervalo}
                          aria-label='Intervalo mínimo entre sufragios'
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
