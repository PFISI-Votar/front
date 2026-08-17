import { useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ActaFormatoContenido } from '@/features/configuracion-sistema/components/acta-formato-contenido'
import type {
  ActaAperturaPlantilla,
  ActaCierrePlantilla,
} from '@/features/configuracion-sistema/data/schema'
import {
  useActualizarFormatoPersonalizadoActaApertura,
  useActualizarFormatoPersonalizadoActaCierre,
  useActualizarPlantillaActaApertura,
  useActualizarPlantillaActaCierre,
  useConfiguracionSistema,
  useEliminarLogoInstitucional,
  useSubirLogoInstitucional,
} from '@/features/configuracion-sistema/hooks/use-configuracion-sistema'
import {
  ACTA_APERTURA_SAMPLE_DATA,
  ACTA_APERTURA_SAMPLE_TEMPLATE,
} from '@/features/eleccion/lib/acta-apertura-sample-data'
import {
  ACTA_APERTURA_VARIABLES,
  buildActaAperturaViewModel,
} from '@/features/eleccion/lib/acta-apertura-template'
import {
  ACTA_CIERRE_SAMPLE_DATA,
  ACTA_CIERRE_SAMPLE_TEMPLATE,
} from '@/features/eleccion/lib/acta-cierre-sample-data'
import {
  ACTA_CIERRE_VARIABLES,
  buildActaCierreViewModel,
} from '@/features/eleccion/lib/acta-cierre-template'
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

const PLANTILLA_ACTA_CIERRE_ITEMS: Array<{
  key: keyof ActaCierrePlantilla
  label: string
  description?: string
}> = [
  {
    key: 'incluirDescripcion',
    label: 'Descripción del comicio',
  },
  {
    key: 'incluirParticipacion',
    label: 'Participación y escrutinio',
    description: 'Votos totales, blancos, nulos y % de participación.',
  },
  {
    key: 'incluirResultadosPorLista',
    label: 'Resultados del escrutinio',
    description: 'Votos por lista o candidato, según el tipo de votación.',
  },
  {
    key: 'incluirVerificacionCriptografica',
    label: 'Verificación criptográfica',
    description:
      'Raíz de Merkle y direcciones de los contratos on-chain (incluye el ' +
      'contrato de escrutinio AuditView, consultable en Sepolia).',
  },
  {
    key: 'incluirLogo',
    label: 'Logo institucional',
  },
]

const ACCORDION_ITEMS = ['logo', 'acta-apertura', 'acta-cierre']

export function ConfiguracionSistemaPage() {
  const { data: configuracion, isLoading } = useConfiguracionSistema()
  const subirLogo = useSubirLogoInstitucional()
  const eliminarLogo = useEliminarLogoInstitucional()
  const actualizarPlantillaApertura = useActualizarPlantillaActaApertura()
  const actualizarFormatoApertura =
    useActualizarFormatoPersonalizadoActaApertura()
  const actualizarPlantillaCierre = useActualizarPlantillaActaCierre()
  const actualizarFormatoCierre = useActualizarFormatoPersonalizadoActaCierre()
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

      <div className='w-full rounded-lg border px-6'>
        <Accordion type='multiple' defaultValue={ACCORDION_ITEMS}>
          <AccordionItem value='logo'>
            <AccordionTrigger>
              <div className='space-y-1 text-left'>
                <p className='text-base font-semibold'>Logo institucional</p>
                <p className='text-sm font-normal text-muted-foreground'>
                  Se embebe en los reportes institucionales generados por la
                  plataforma (Acta de Apertura, Acta de Cierre).
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {isLoading ? (
                <p className='text-sm text-muted-foreground'>Cargando…</p>
              ) : (
                <div className='max-w-xl space-y-4'>
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
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='acta-apertura'>
            <AccordionTrigger>
              <div className='space-y-1 text-left'>
                <p className='text-base font-semibold'>
                  Formato del Acta de Apertura
                </p>
                <p className='text-sm font-normal text-muted-foreground'>
                  Secciones fijas (Simple) o un texto propio que combina con los
                  datos del comicio (Personalizado).
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ActaFormatoContenido
                isLoading={isLoading}
                modo={configuracion?.actaAperturaModo ?? 'SIMPLE'}
                onModoChange={(modo) =>
                  actualizarFormatoApertura.mutate({ modo })
                }
                toggles={PLANTILLA_ACTA_APERTURA_ITEMS.map((item) => ({
                  ...item,
                  checked:
                    configuracion?.actaAperturaPlantilla[item.key] ?? true,
                }))}
                onToggleChange={(key, checked) =>
                  actualizarPlantillaApertura.mutate({ [key]: checked })
                }
                togglesPending={actualizarPlantillaApertura.isPending}
                editorProps={{
                  variables: ACTA_APERTURA_VARIABLES,
                  sampleData: ACTA_APERTURA_SAMPLE_DATA,
                  sampleTemplate: ACTA_APERTURA_SAMPLE_TEMPLATE,
                  buildViewModel: buildActaAperturaViewModel,
                  plantillaTextoGuardada:
                    configuracion?.actaAperturaPlantillaTexto ?? null,
                  isPending: actualizarFormatoApertura.isPending,
                  onGuardar: (texto) =>
                    actualizarFormatoApertura.mutate({
                      plantillaTexto: texto,
                    }),
                }}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='acta-cierre'>
            <AccordionTrigger>
              <div className='space-y-1 text-left'>
                <p className='text-base font-semibold'>
                  Formato del Acta de Cierre
                </p>
                <p className='text-sm font-normal text-muted-foreground'>
                  Secciones fijas (Simple) o un texto propio (Personalizado)
                  para el escrutinio final.
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ActaFormatoContenido
                isLoading={isLoading}
                modo={configuracion?.actaCierreModo ?? 'SIMPLE'}
                onModoChange={(modo) =>
                  actualizarFormatoCierre.mutate({ modo })
                }
                toggles={PLANTILLA_ACTA_CIERRE_ITEMS.map((item) => ({
                  ...item,
                  checked: configuracion?.actaCierrePlantilla[item.key] ?? true,
                }))}
                onToggleChange={(key, checked) =>
                  actualizarPlantillaCierre.mutate({ [key]: checked })
                }
                togglesPending={actualizarPlantillaCierre.isPending}
                editorProps={{
                  variables: ACTA_CIERRE_VARIABLES,
                  sampleData: ACTA_CIERRE_SAMPLE_DATA,
                  sampleTemplate: ACTA_CIERRE_SAMPLE_TEMPLATE,
                  buildViewModel: buildActaCierreViewModel,
                  plantillaTextoGuardada:
                    configuracion?.actaCierrePlantillaTexto ?? null,
                  isPending: actualizarFormatoCierre.isPending,
                  onGuardar: (texto) =>
                    actualizarFormatoCierre.mutate({ plantillaTexto: texto }),
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}
