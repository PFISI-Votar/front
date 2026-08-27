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
import { interpolarPlantilla } from '@/features/eleccion/lib/plantilla-interpolacion'

export type ActaFormatoVariable = {
  grupo: string
  token: string
  label: string
}

export type ActaFormatoEditorProps<T> = {
  variables: ActaFormatoVariable[]
  sampleData: T
  sampleTemplate: string
  buildViewModel: (data: T) => Record<string, string>
  plantillaTextoGuardada: string | null
  onGuardar: (texto: string) => void
  isPending: boolean
}

/**
 * Editor de formato personalizado reutilizable por cualquier acta oficial
 * (Apertura, Cierre, futuras): paleta de variables oculta detrás de un
 * popover, textarea compacto que crece hacia abajo, y preview colapsable
 * contra datos de prueba. La parte específica de cada documento (qué
 * variables existen, cómo se arma el view model, el texto de ejemplo) se
 * inyecta por props — este componente no sabe qué acta está editando.
 */
export function ActaFormatoEditor<T>({
  variables,
  sampleData,
  sampleTemplate,
  buildViewModel,
  plantillaTextoGuardada,
  onGuardar,
  isPending,
}: ActaFormatoEditorProps<T>) {
  const textoInicial = plantillaTextoGuardada ?? sampleTemplate
  const [texto, setTexto] = useState(textoInicial)
  const [variablesAbiertas, setVariablesAbiertas] = useState(false)
  const [previewAbierto, setPreviewAbierto] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hayCambiosSinGuardar = texto !== (plantillaTextoGuardada ?? '')

  const variableGrupos = useMemo(
    () => Array.from(new Set(variables.map((variable) => variable.grupo))),
    [variables]
  )

  const preview = useMemo(() => {
    const viewModel = buildViewModel(sampleData)
    return interpolarPlantilla(texto, viewModel)
  }, [texto, sampleData, buildViewModel])

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
              {variableGrupos.map((grupo) => (
                <div key={grupo} className='space-y-1'>
                  <p className='px-1 text-xs font-medium text-muted-foreground'>
                    {grupo}
                  </p>
                  {variables
                    .filter((variable) => variable.grupo === grupo)
                    .map((variable) => (
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
