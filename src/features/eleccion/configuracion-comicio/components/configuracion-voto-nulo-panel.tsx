import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, ChevronDown, Lock } from 'lucide-react'
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
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  guardarConfiguracionVotoNuloSchema,
  type GuardarConfiguracionVotoNuloInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  useConfiguracionVotoNulo,
  useGuardarConfiguracionVotoNulo,
} from '@/features/eleccion/configuracion-comicio/hooks/use-configuracion-voto-nulo'

type ConfiguracionVotoNuloPanelProps = {
  idEleccion: number
  isEditable: boolean
}

export const ConfiguracionVotoNuloPanel = ({
  idEleccion,
  isEditable,
}: ConfiguracionVotoNuloPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const configQuery = useConfiguracionVotoNulo(idEleccion)
  const guardarMutation = useGuardarConfiguracionVotoNulo(idEleccion)

  const form = useForm<GuardarConfiguracionVotoNuloInput>({
    resolver: zodResolver(guardarConfiguracionVotoNuloSchema),
    defaultValues: {
      permitirVotoNulo: true,
    },
  })

  const canEditForm = isEditable && (configQuery.data?.editable ?? false)

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      permitirVotoNulo: configQuery.data.permitirVotoNulo,
    })
  }, [configQuery.data, form])

  const handleSubmit = async (values: GuardarConfiguracionVotoNuloInput) => {
    try {
      await guardarMutation.mutateAsync(values)
      toast.success('Configuración de voto nulo guardada')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const resumen =
    configQuery.data?.permitirVotoNulo === false
      ? 'Opción "Anular voto" oculta en la boleta única digital'
      : 'Opción "Anular voto" visible en la boleta única digital'

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle className='flex items-center gap-2'>
          <Ban className='size-5 text-primary' aria-hidden='true' />
          Voto nulo
        </CardTitle>
        <CardDescription>
          {isOpen
            ? 'Habilita o deshabilita la opción "Anular voto" en la boleta única digital (BUD) del comicio.'
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
          <CardTitle>Voto nulo</CardTitle>
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
                ? 'Ocultar configuración de voto nulo'
                : 'Mostrar configuración de voto nulo'
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
                  La configuración de voto nulo no puede modificarse porque el
                  comicio ya no está en borrador.
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
                  name='permitirVotoNulo'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between gap-4'>
                      <div className='flex flex-col gap-1'>
                        <FormLabel>Permitir anular el voto</FormLabel>
                        <FormDescription>
                          Muestra la opción "Anular voto" en la boleta única
                          digital del votante.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEditForm}
                          aria-label='Permitir anular el voto'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {canEditForm && (
                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={guardarMutation.isPending}
                      aria-label='Guardar configuración de voto nulo'
                    >
                      {guardarMutation.isPending
                        ? 'Guardando…'
                        : 'Guardar configuración'}
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
