// validar-padron.ts
import type { RegistroPreview, TipoNovedadPreview } from './parse-csv-padron'

const REGEX_DNI = /^\d{7,9}$/
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function claveDedup(dni: string, email: string): string {
  return `${dni.trim().replace(/\D/g, '')}:${email.trim().toLowerCase()}`
}

export function validarRegistros(
  registros: RegistroPreview[],
): Record<string, TipoNovedadPreview> {
  const vistos = new Set<string>()
  const estados: Record<string, TipoNovedadPreview> = {}

  for (const reg of registros) {
    const dni = reg.dni.trim()
    const email = reg.email.trim()

    if (dni === '') {
      estados[reg.id] = 'DNI_AUSENTE'
      continue
    }
    if (email === '') {
      estados[reg.id] = 'EMAIL_AUSENTE'
      continue
    }
    if (!REGEX_DNI.test(dni.replace(/\D/g, ''))) {
      estados[reg.id] = 'DNI_INVALIDO'
      continue
    }
    if (!REGEX_EMAIL.test(email)) {
      estados[reg.id] = 'EMAIL_INVALIDO'
      continue
    }

    const clave = claveDedup(dni, email)
    if (vistos.has(clave)) {
      estados[reg.id] = 'DUPLICADO'
      continue
    }
    vistos.add(clave)
    estados[reg.id] = 'OK'
  }

  return estados
}

export function contarProblemas(
  estados: Record<string, TipoNovedadPreview>,
): number {
  return Object.values(estados).filter((e) => e !== 'OK').length
}
