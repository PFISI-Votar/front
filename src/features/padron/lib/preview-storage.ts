import {
  CAMPOS_PADRON_PREDEFINIDOS,
  normalizarCamposSeleccionados,
  type CampoPadronDefinicion,
  type ClaveCampoPadron,
} from './campos-padron'
import type { RegistroPreview } from './parse-csv-padron'

export interface PadronPreviewPayload {
  campos: ClaveCampoPadron[]
  definiciones: CampoPadronDefinicion[]
  registros: RegistroPreview[]
}

export function clavePreview(idEleccion: number): string {
  return `padron-preview:${idEleccion}`
}

export function guardarPreview(
  idEleccion: number,
  registros: RegistroPreview[],
  campos: ClaveCampoPadron[] = ['dni', 'email'],
  definiciones: CampoPadronDefinicion[] = CAMPOS_PADRON_PREDEFINIDOS
): void {
  const payload: PadronPreviewPayload = {
    campos: normalizarCamposSeleccionados(campos, definiciones),
    definiciones,
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
        definiciones: CAMPOS_PADRON_PREDEFINIDOS,
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
      const definiciones =
        payload.definiciones?.length > 0
          ? payload.definiciones
          : CAMPOS_PADRON_PREDEFINIDOS
      return {
        campos: normalizarCamposSeleccionados(
          payload.campos ?? ['dni', 'email'],
          definiciones
        ),
        definiciones,
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
