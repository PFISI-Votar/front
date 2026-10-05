import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Eye, Info, Lock } from 'lucide-react'
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
  guardarVisibilidadDashboardSchema,
  type GuardarVisibilidadDashboardInput,
} from '@/features/eleccion/configuracion-comicio/data/schema'
import {
  useGuardarVisibilidadDashboard,
  useVisibilidadDashboard,
} from '@/features/eleccion/configuracion-comicio/hooks/use-visibilidad-dashboard'

type VisibilidadDashboardPanelProps = {
  idEleccion: number
}

const SECCIONES: Array<{
  name: keyof GuardarVisibilidadDashboardInput
  label: string
  description: string
}> = [
  {
    name: 'mostrarResultados',
    label: 'Resultados',
    description:
      'Escrutinio parcial/final con los conteos por candidato o lista.',
  },
  {
    name: 'mostrarParticipacion',
    label: 'Participación',
    description: 'Métricas de afluencia y curva temporal de sufragios.',
  },
  {
    name: 'mostrarRevoto',
    label: 'Re-voto',
    description: 'Estadísticas de sobreescritura de votos (LAST_VOTE_WINS).',
  },
  {
    name: 'mostrarTransacciones',
    label: 'Transacciones',
    description: 'Historial cronológico de transacciones on-chain.',
  },
]

export const VisibilidadDashboardPanel = ({
  idEleccion,
}: VisibilidadDashboardPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const configQuery = useVisibilidadDashboard(idEleccion)
  const guardarMutation = useGuardarVisibilidadDashboard(idEleccion)

  const form = useForm<GuardarVisibilidadDashboardInput>({
    resolver: zodResolver(guardarVisibilidadDashboardSchema),
    defaultValues: {
      mostrarResultados: true,
      mostrarParticipacion: true,
      mostrarRevoto: true,
      mostrarTransacciones: true,
    },
  })

  // VOTAR-459: a diferencia del resto de la configuración del comicio, esta
  // sigue siendo editable en CONFIGURADA — la fuente de verdad es el backend.
  const canEditForm = configQuery.data?.editable ?? false

  useEffect(() => {
    if (!configQuery.data) {
      return
    }
    form.reset({
      mostrarResultados: configQuery.data.mostrarResultados,
      mostrarParticipacion: configQuery.data.mostrarParticipacion,
      mostrarRevoto: configQuery.data.mostrarRevoto,
      mostrarTransacciones: configQuery.data.mostrarTransacciones,
    })
  }, [configQuery.data, form])

  const handleSubmit = async (values: GuardarVisibilidadDashboardInput) => {
    try {
      await guardarMutation.mutateAsync(values)
      toast.success('Visibilidad del dashboard público guardada')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const cantidadVisible = configQuery.data
    ? SECCIONES.filter((seccion) => configQuery.data?.[seccion.name]).length
    : SECCIONES.length
  const resumen = `${cantidadVisible} de ${SECCIONES.length} secciones visibles durante el comicio`

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle className='flex items-center gap-2'>
          <Eye className='size-5 text-primary' aria-hidden='true' />
          Visibilidad del dashboard público
        </CardTitle>
        <CardDescription>
          {isOpen
            ? 'Oculta solapas del Portal de Transparencia mientras el comicio está en curso, para no inducir comportamiento estratégico del electorado.'
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
          <CardTitle>Visibilidad del dashboard público</CardTitle>
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
                ? 'Ocultar configuración de visibilidad del dashboard público'
                : 'Mostrar configuración de visibilidad del dashboard público'
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
                  La visibilidad del dashboard público no puede modificarse
                  porque el comicio ya fue abierto.
                </AlertDescription>
              </Alert>
            )}

            <Alert variant='default'>
              <Info className='size-4' />
              <AlertDescription>
                Resumen, Oferta electoral, Padrón y Estado siempre son públicos.
                Al cerrar el comicio, todas las secciones vuelven a ser públicas
                sin importar esta configuración.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='flex flex-col gap-6'
              >
                {SECCIONES.map((seccion) => (
                  <FormField
                    key={seccion.name}
                    control={form.control}
                    name={seccion.name}
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between gap-4'>
                        <div className='flex flex-col gap-1'>
                          <FormLabel>{seccion.label}</FormLabel>
                          <FormDescription>
                            {seccion.description}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canEditForm}
                            aria-label={`Mostrar solapa ${seccion.label} en el dashboard público`}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}

                {canEditForm && (
                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={guardarMutation.isPending}
                      aria-label='Guardar configuración de visibilidad del dashboard público'
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
