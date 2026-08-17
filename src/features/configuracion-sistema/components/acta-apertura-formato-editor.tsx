import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Variable } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import {
  ACTA_APERTURA_SAMPLE_DATA,
  ACTA_APERTURA_SAMPLE_TEMPLATE,
} from '@/features/eleccion/lib/acta-apertura-sample-data'
import {
  ACTA_APERTURA_VARIABLES,
  buildActaAperturaViewModel,
  interpolarPlantillaActaApertura,
} from '@/features/eleccion/lib/acta-apertura-template'

type ActaAperturaFormatoEditorProps = {
  plantillaTextoGuardada: string | null
  onGuardar: (texto: string) => void
  isPending: boolean
}

const VARIABLE_GRUPOS = Array.from(
  new Set(ACTA_APERTURA_VARIABLES.map((variable) => variable.grupo))
)

export function ActaAperturaFormatoEditor({
  plantillaTextoGuardada,
  onGuardar,
  isPending,
}: ActaAperturaFormatoEditorProps) {
  const textoInicial = plantillaTextoGuardada ?? ACTA_APERTURA_SAMPLE_TEMPLATE
  const [texto, setTexto] = useState(textoInicial)
  const [variablesAbiertas, setVariablesAbiertas] = useState(false)
  const [previewAbierto, setPreviewAbierto] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hayCambiosSinGuardar = texto !== (plantillaTextoGuardada ?? '')

  const preview = useMemo(() => {
    const viewModel = buildActaAperturaViewModel(ACTA_APERTURA_SAMPLE_DATA)
    return interpolarPlantillaActaApertura(texto, viewModel)
  }, [texto])

  const insertarVariable = (token: string) => {
    const textarea = textareaRef.current
    const placeholder = `{{${token}}}`
    if (!textarea) {
      setTexto((prev) => prev + placeholder)
      return
    }
    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const siguiente = texto.slice(0, inicio) + placeholder + texto.slice(fin)
    setTexto(siguiente)
    setVariablesAbiertas(false)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = inicio + placeholder.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-2'>
        <Popover open={variablesAbiertas} onOpenChange={setVariablesAbiertas}>
          <PopoverTrigger asChild>
            <Button type='button' variant='outline' size='sm'>
              <Variable />
              Insertar variable
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='max-h-80 w-80 overflow-y-auto p-2'
          >
            <div className='space-y-3'>
              {VARIABLE_GRUPOS.map((grupo) => (
                <div key={grupo} className='space-y-1'>
                  <p className='px-1 text-xs font-medium text-muted-foreground'>
                    {grupo}
                  </p>
                  {ACTA_APERTURA_VARIABLES.filter(
                    (variable) => variable.grupo === grupo
                  ).map((variable) => (
                    <button
                      key={variable.token}
                      type='button'
                      title={variable.label}
                      onClick={() => insertarVariable(variable.token)}
                      className='block w-full rounded-sm px-1 py-1 text-left font-mono text-[11px] hover:bg-accent'
                    >
                      {`{{${variable.token}}}`}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Textarea
        ref={textareaRef}
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        rows={6}
        className='font-mono text-sm'
        placeholder='Escribí el cuerpo del Acta e insertá variables con el botón de arriba…'
      />
      <p className='text-xs text-muted-foreground'>
        Una variable no reconocida (typo) queda visible tal cual en el
        documento, para que se note el error. El encabezado institucional (logo,
        título) y el pie legal se agregan siempre, no forman parte de este
        texto.
      </p>

      <Button
        type='button'
        size='sm'
        disabled={!hayCambiosSinGuardar || isPending}
        onClick={() => onGuardar(texto)}
      >
        {isPending ? 'Guardando…' : 'Guardar plantilla'}
      </Button>

      <Collapsible open={previewAbierto} onOpenChange={setPreviewAbierto}>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='ghost' size='sm' className='-ms-2'>
            <ChevronDown
              className={cn(
                'transition-transform',
                previewAbierto && 'rotate-180'
              )}
            />
            Vista previa (datos de prueba)
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-2'>
          <div className='rounded-md border bg-white p-4 text-sm whitespace-pre-wrap text-neutral-800 shadow-sm'>
            {preview || (
              <span className='text-muted-foreground italic'>
                El cuerpo del Acta aparece vacío. Escribí texto arriba para ver
                la previsualización.
              </span>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
