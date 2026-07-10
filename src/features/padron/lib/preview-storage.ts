import {
  normalizarCamposSeleccionados,
  type ClaveCampoPadron,
} from './campos-padron'
import type { RegistroPreview } from './parse-csv-padron'

export interface PadronPreviewPayload {
  campos: ClaveCampoPadron[]
  registros: RegistroPreview[]
}

export function clavePreview(idEleccion: number): string {
  return `padron-preview:${idEleccion}`
}

export function guardarPreview(
  idEleccion: number,
  registros: RegistroPreview[],
  campos: ClaveCampoPadron[] = ['dni', 'email']
): void {
  const payload: PadronPreviewPayload = {
    campos: normalizarCamposSeleccionados(campos),
    registros: registros.map((r) => ({
      ...r,
      adicionales: r.adicionales ?? {},
    })),
  }
  sessionStorage.setItem(clavePreview(idEleccion), JSON.stringify(payload))
}

export function leerPreview(idEleccion: number): PadronPreviewPayload | null {
  const crudo = sessionStorage.getItem(clavePreview(idEleccion))
  if (crudo === null) return null
  try {
    const parsed: unknown = JSON.parse(crudo)
    // Compat: versiones previas guardaban sólo el array de registros.
    if (Array.isArray(parsed)) {
      return {
        campos: ['dni', 'email'],
        registros: (parsed as RegistroPreview[]).map((r) => ({
          ...r,
          adicionales: r.adicionales ?? {},
        })),
      }
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as PadronPreviewPayload).registros)
    ) {
      const payload = parsed as PadronPreviewPayload
      return {
        campos: normalizarCamposSeleccionados(
          payload.campos ?? ['dni', 'email']
        ),
        registros: payload.registros.map((r) => ({
          ...r,
          adicionales: r.adicionales ?? {},
        })),
      }
    }
    return null
  } catch {
    return null
  }
}

export function limpiarPreview(idEleccion: number): void {
  sessionStorage.removeItem(clavePreview(idEleccion))
}
