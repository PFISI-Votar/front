import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CAMPOS_PADRON, type ClaveCampoPadron } from '../lib/campos-padron'

interface PadronCamposSelectorProps {
  value: ClaveCampoPadron[]
  onChange: (campos: ClaveCampoPadron[]) => void
}

export function PadronCamposSelector({
  value,
  onChange,
}: PadronCamposSelectorProps) {
  const seleccion = new Set(value)

  const toggle = (clave: ClaveCampoPadron, obligatorio: boolean) => {
    if (obligatorio) return
    const next = new Set(seleccion)
    if (next.has(clave)) next.delete(clave)
    else next.add(clave)
    onChange(CAMPOS_PADRON.map((c) => c.clave).filter((k) => next.has(k)))
  }

  return (
    <fieldset className='space-y-3'>
      <legend className='text-sm font-medium'>
        Campos del archivo CSV / Excel
      </legend>
      <p className='text-xs text-muted-foreground'>
        Elija qué columnas traerá el archivo. DNI y email son obligatorios
        (identidad del padrón). El resto es opcional y sólo se usa en la
        previsualización.
      </p>
      <div className='flex flex-wrap gap-x-6 gap-y-3'>
        {CAMPOS_PADRON.map((campo) => {
          const checked = seleccion.has(campo.clave)
          const id = `campo-padron-${campo.clave}`
          return (
            <div key={campo.clave} className='flex items-center gap-2'>
              <Checkbox
                id={id}
                checked={checked}
                disabled={campo.obligatorio}
                onCheckedChange={() => toggle(campo.clave, campo.obligatorio)}
              />
              <Label
                htmlFor={id}
                className={
                  campo.obligatorio ? 'text-muted-foreground' : 'cursor-pointer'
                }
              >
                {campo.etiqueta}
                {campo.obligatorio ? ' (requerido)' : ''}
              </Label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
