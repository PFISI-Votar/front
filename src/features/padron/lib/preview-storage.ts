// preview-storage.ts
import type { RegistroPreview } from './parse-csv-padron'

export function clavePreview(idEleccion: number): string {
  return `padron-preview:${idEleccion}`
}

export function guardarPreview(
  idEleccion: number,
  registros: RegistroPreview[]
): void {
  sessionStorage.setItem(clavePreview(idEleccion), JSON.stringify(registros))
}

export function leerPreview(idEleccion: number): RegistroPreview[] | null {
  const crudo = sessionStorage.getItem(clavePreview(idEleccion))
  if (crudo === null) return null
  try {
    const parsed = JSON.parse(crudo)
    return Array.isArray(parsed) ? (parsed as RegistroPreview[]) : null
  } catch {
    return null
  }
}

export function limpiarPreview(idEleccion: number): void {
  sessionStorage.removeItem(clavePreview(idEleccion))
}
