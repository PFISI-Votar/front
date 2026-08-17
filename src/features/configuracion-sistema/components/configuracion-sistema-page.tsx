import { useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActaAperturaFormatoEditor } from '@/features/configuracion-sistema/components/acta-apertura-formato-editor'
import type { ActaAperturaPlantilla } from '@/features/configuracion-sistema/data/schema'
import {
  useActualizarFormatoPersonalizadoActaApertura,
  useActualizarPlantillaActaApertura,
  useConfiguracionSistema,
  useEliminarLogoInstitucional,
  useSubirLogoInstitucional,
} from '@/features/configuracion-sistema/hooks/use-configuracion-sistema'
import {
  IMAGE_FILE_REQUIREMENTS,
  validateElectoralImageFile,
} from '@/features/eleccion/shared/utils/image-file'

const PLANTILLA_ACTA_APERTURA_ITEMS: Array<{
  key: keyof ActaAperturaPlantilla
  label: string
  description?: string
}> = [
  {
    key: 'incluirDescripcion',
    label: 'Descripción del comicio',
  },
  {
    key: 'incluirDatosApertura',
    label: 'Datos de apertura',
    description: 'Responsable, rol y fecha/hora real de apertura.',
  },
  {
    key: 'incluirResumenPadron',
    label: 'Resumen del padrón electoral',
    description:
      'Total de votantes habilitados y hash del padrón. El sistema nunca ' +
      'guarda identidades en texto plano (Ley 25.326), por lo que el Acta ' +
      'solo puede mostrar agregados, nunca un listado de votantes.',
  },
  {
    key: 'incluirOfertaElectoral',
    label: 'Oferta electoral',
    description: 'Candidatos oficializados por categoría.',
  },
  {
    key: 'incluirVerificacionCriptografica',
    label: 'Verificación criptográfica',
    description: 'Raíz de Merkle y direcciones de los contratos on-chain.',
  },
  {
    key: 'incluirLogo',
    label: 'Logo institucional',
  },
]

export function ConfiguracionSistemaPage() {
  const { data: configuracion, isLoading } = useConfiguracionSistema()
  const subirLogo = useSubirLogoInstitucional()
  const eliminarLogo = useEliminarLogoInstitucional()
  const actualizarPlantilla = useActualizarPlantillaActaApertura()
  const actualizarFormato = useActualizarFormatoPersonalizadoActaApertura()
  const [fileError, setFileError] = useState<string | null>(null)

  const handleFileChange = (file?: File) => {
    if (!file) {
      return
    }
    const validationError = validateElectoralImageFile(file)
    if (validationError) {
      setFileError(validationError)
      return
    }
    setFileError(null)
    subirLogo.mutate(file)
  }

  const logoPreview = resolveMediaUrl(configuracion?.logoUrl)
  const isPending = subirLogo.isPending || eliminarLogo.isPending

  return (
    <>
      <div className='space-y-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Configuración
        </h1>
        <p className='text-muted-foreground'>
          Parámetros globales, válidos para todos los comicios.
        </p>
      </div>
      <Separator className='my-4 lg:my-6' />
      <Card className='max-w-xl'>
        <CardHeader>
          <CardTitle>Logo institucional</CardTitle>
          <CardDescription>
            Se embebe en los reportes institucionales generados por la
            plataforma (ej. Acta de Apertura).
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Cargando…</p>
          ) : (
            <>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt='Logo institucional'
                  className='h-32 w-full rounded-md border bg-muted object-contain p-2'
                />
              ) : (
                <div className='grid h-32 place-items-center rounded-md border bg-muted text-sm text-muted-foreground'>
                  Sin logo institucional
                </div>
              )}
              <p className='text-xs text-muted-foreground'>
                {IMAGE_FILE_REQUIREMENTS}
              </p>
              <div className='flex flex-wrap items-center gap-2'>
                <Input
                  type='file'
                  accept='image/png,image/jpeg,.png,.jpg,.jpeg'
                  disabled={isPending}
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0])
                  }
                  className='max-w-xs'
                />
                {logoPreview && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isPending}
                    onClick={() => eliminarLogo.mutate()}
                  >
                    <Trash2 />
                    Eliminar
                  </Button>
                )}
              </div>
              {fileError && (
                <p className='text-sm text-destructive' role='alert'>
                  {fileError}
                </p>
              )}
              {subirLogo.isPending && (
                <p className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <Upload className='size-4' />
                  Subiendo logo…
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className='mt-4 max-w-xl lg:mt-6'>
        <CardHeader>
          <CardTitle>Formato del Acta de Apertura</CardTitle>
          <CardDescription>
            Elegí cómo se arma el PDF del Acta de Apertura: con secciones fijas
            (Simple) o con un texto propio que combina con los datos del comicio
            (Personalizado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Cargando…</p>
          ) : (
            <Tabs
              value={configuracion?.actaAperturaModo ?? 'SIMPLE'}
              onValueChange={(modo) =>
                actualizarFormato.mutate({
                  modo: modo as 'SIMPLE' | 'PERSONALIZADO',
                })
              }
            >
              <TabsList>
                <TabsTrigger value='SIMPLE'>Simple</TabsTrigger>
                <TabsTrigger value='PERSONALIZADO'>Personalizado</TabsTrigger>
              </TabsList>

              <TabsContent value='SIMPLE' className='space-y-5 pt-2'>
                {PLANTILLA_ACTA_APERTURA_ITEMS.map((item) => (
                  <div key={item.key} className='flex items-start gap-3'>
                    <Switch
                      id={item.key}
                      checked={
                        configuracion?.actaAperturaPlantilla[item.key] ?? true
                      }
                      disabled={actualizarPlantilla.isPending}
                      onCheckedChange={(checked) =>
                        actualizarPlantilla.mutate({ [item.key]: checked })
                      }
                    />
                    <div className='space-y-0.5'>
                      <Label htmlFor={item.key}>{item.label}</Label>
                      {item.description && (
                        <p className='text-xs text-muted-foreground'>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value='PERSONALIZADO' className='pt-2'>
                <ActaAperturaFormatoEditor
                  plantillaTextoGuardada={
                    configuracion?.actaAperturaPlantillaTexto ?? null
                  }
                  isPending={actualizarFormato.isPending}
                  onGuardar={(texto) =>
                    actualizarFormato.mutate({ plantillaTexto: texto })
                  }
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  )
}
