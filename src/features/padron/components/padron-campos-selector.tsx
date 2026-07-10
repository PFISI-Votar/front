import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  crearCampoPersonalizado,
  esCampoObligatorio,
  normalizarCamposSeleccionados,
  type CampoPadronDefinicion,
  type ClaveCampoPadron,
} from '../lib/campos-padron'

interface PadronCamposSelectorProps {
  value: ClaveCampoPadron[]
  onChange: (campos: ClaveCampoPadron[]) => void
  definiciones: CampoPadronDefinicion[]
  onDefinicionesChange: (definiciones: CampoPadronDefinicion[]) => void
}

export function PadronCamposSelector({
  value,
  onChange,
  definiciones,
  onDefinicionesChange,
}: PadronCamposSelectorProps) {
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('')
  const seleccion = new Set(value)

  const toggle = (clave: ClaveCampoPadron) => {
    if (esCampoObligatorio(clave)) return
    const next = new Set(seleccion)
    if (next.has(clave)) next.delete(clave)
    else next.add(clave)
    onChange(normalizarCamposSeleccionados([...next], definiciones))
  }

  const agregarPersonalizado = () => {
    const campo = crearCampoPersonalizado(nuevaEtiqueta, definiciones)
    if (!campo) return
    const nextDefs = [...definiciones, campo]
    onDefinicionesChange(nextDefs)
    onChange(normalizarCamposSeleccionados([...value, campo.clave], nextDefs))
    setNuevaEtiqueta('')
  }

  const quitarPersonalizado = (clave: ClaveCampoPadron) => {
    const nextDefs = definiciones.filter((d) => d.clave !== clave)
    onDefinicionesChange(nextDefs)
    onChange(
      normalizarCamposSeleccionados(
        value.filter((c) => c !== clave),
        nextDefs
      )
    )
  }

  const predefinidos = definiciones.filter((d) => !d.personalizado)
  const personalizados = definiciones.filter((d) => d.personalizado)

  return (
    <fieldset className='space-y-3'>
      <legend className='text-sm font-medium'>
        Campos del archivo CSV / Excel
      </legend>
      <p className='text-xs text-muted-foreground'>
        DNI y email son obligatorios: forman el hash de identidad del padrón
        (mismo cálculo que el login vía Autogestión). El resto de columnas es
        opcional y sólo se usa en la previsualización.
      </p>
      <div className='flex flex-wrap gap-x-6 gap-y-3'>
        {predefinidos.map((campo) => {
          const checked = seleccion.has(campo.clave)
          const id = `campo-padron-${campo.clave}`
          return (
            <div key={campo.clave} className='flex items-center gap-2'>
              <Checkbox
                id={id}
                checked={checked}
                disabled={campo.obligatorio}
                onCheckedChange={() => toggle(campo.clave)}
              />
              <Label
                htmlFor={id}
                className={
                  campo.obligatorio ? 'text-muted-foreground' : 'cursor-pointer'
                }
              >
                {campo.etiqueta}
                {campo.obligatorio ? <span> (requerido)</span> : null}
              </Label>
            </div>
          )
        })}
      </div>

      {personalizados.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-medium text-muted-foreground'>
            Campos personalizados
          </p>
          <div className='flex flex-wrap gap-x-4 gap-y-2'>
            {personalizados.map((campo) => {
              const checked = seleccion.has(campo.clave)
              const id = `campo-padron-${campo.clave}`
              return (
                <div key={campo.clave} className='flex items-center gap-2'>
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() => toggle(campo.clave)}
                  />
                  <Label htmlFor={id} className='cursor-pointer'>
                    {campo.etiqueta}
                    <span className='ms-1 font-mono text-xs text-muted-foreground'>
                      ({campo.clave})
                    </span>
                  </Label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    aria-label={`Quitar campo ${campo.etiqueta}`}
                    onClick={() => quitarPersonalizado(campo.clave)}
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className='flex flex-wrap items-end gap-2'>
        <div className='min-w-48 flex-1 space-y-1'>
          <Label htmlFor='campo-personalizado-padron' className='text-xs'>
            Nuevo campo personalizado
          </Label>
          <Input
            id='campo-personalizado-padron'
            value={nuevaEtiqueta}
            placeholder='Ej. Legajo, Carrera…'
            onChange={(e) => setNuevaEtiqueta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarPersonalizado()
              }
            }}
          />
        </div>
        <Button
          type='button'
          variant='outline'
          disabled={!nuevaEtiqueta.trim()}
          onClick={agregarPersonalizado}
        >
          <Plus className='size-4' />
          Agregar columna
        </Button>
      </div>
    </fieldset>
  )
}
