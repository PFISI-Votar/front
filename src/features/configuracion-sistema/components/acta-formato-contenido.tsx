import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ActaFormatoEditor,
  type ActaFormatoEditorProps,
} from '@/features/configuracion-sistema/components/acta-formato-editor'

export type ActaFormatoToggleItem = {
  key: string
  label: string
  description?: string
  checked: boolean
}

type ActaFormatoContenidoProps<T> = {
  isLoading: boolean
  modo: 'SIMPLE' | 'PERSONALIZADO'
  onModoChange: (modo: 'SIMPLE' | 'PERSONALIZADO') => void
  toggles: ActaFormatoToggleItem[]
  onToggleChange: (key: string, checked: boolean) => void
  togglesPending: boolean
  editorProps: ActaFormatoEditorProps<T>
}

/**
 * Contenido de "Formato del Acta de X": selector Simple/Personalizado +
 * toggles de secciones fijas + editor de texto con variables. Compartido
 * por Acta de Apertura y Acta de Cierre — el título/descripción los pone
 * el `AccordionTrigger` que envuelve a este componente en
 * `configuracion-sistema-page.tsx`.
 */
export function ActaFormatoContenido<T>({
  isLoading,
  modo,
  onModoChange,
  toggles,
  onToggleChange,
  togglesPending,
  editorProps,
}: ActaFormatoContenidoProps<T>) {
  if (isLoading) {
    return <p className='text-sm text-muted-foreground'>Cargando…</p>
  }

  return (
    <Tabs
      value={modo}
      onValueChange={(value) =>
        onModoChange(value as 'SIMPLE' | 'PERSONALIZADO')
      }
    >
      <TabsList>
        <TabsTrigger value='SIMPLE'>Simple</TabsTrigger>
        <TabsTrigger value='PERSONALIZADO'>Personalizado</TabsTrigger>
      </TabsList>

      <TabsContent value='SIMPLE' className='space-y-5 pt-2'>
        {toggles.map((item) => (
          <div key={item.key} className='flex items-start gap-3'>
            <Switch
              id={item.key}
              checked={item.checked}
              disabled={togglesPending}
              onCheckedChange={(checked) => onToggleChange(item.key, checked)}
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
        <ActaFormatoEditor {...editorProps} />
      </TabsContent>
    </Tabs>
  )
}
