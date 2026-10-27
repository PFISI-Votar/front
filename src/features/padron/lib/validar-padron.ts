import { CriterioHashPadron } from './campos-padron'
import type { RegistroPreview, TipoNovedadPreview } from './parse-csv-padron'

const REGEX_DNI = /^\d{7,9}$/
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function claveDedup(
  dni: string,
  email: string,
  criterio: CriterioHashPadron = CriterioHashPadron.DNI
): string {
  const dniNorm = dni.trim().replace(/\D/g, '')
  const emailNorm = email.trim().toLowerCase()
  if (criterio === CriterioHashPadron.EMAIL) {
    return emailNorm
  }
  if (criterio === CriterioHashPadron.DNI_Y_EMAIL) {
    return `${dniNorm}:${emailNorm}`
  }
  return dniNorm
}

export function validarRegistros(
  registros: RegistroPreview[],
  criterio: CriterioHashPadron = CriterioHashPadron.DNI
): Record<string, TipoNovedadPreview> {
  const vistos = new Set<string>()
  const estados: Record<string, TipoNovedadPreview> = {}

  for (const reg of registros) {
    const dni = reg.dni.trim()
    const email = reg.email.trim()

    // Validar DNI según criterio
    if (
      criterio === CriterioHashPadron.DNI ||
      criterio === CriterioHashPadron.DNI_Y_EMAIL
    ) {
      if (dni === '') {
        estados[reg.id] = 'DNI_AUSENTE'
        continue
      }
      if (!REGEX_DNI.test(dni.replace(/\D/g, ''))) {
        estados[reg.id] = 'DNI_INVALIDO'
        continue
      }
    } else if (dni !== '' && !REGEX_DNI.test(dni.replace(/\D/g, ''))) {
      estados[reg.id] = 'DNI_INVALIDO'
      continue
    }

    // Validar Email según criterio
    if (
      criterio === CriterioHashPadron.EMAIL ||
      criterio === CriterioHashPadron.DNI_Y_EMAIL
    ) {
      if (email === '') {
        estados[reg.id] = 'EMAIL_AUSENTE'
        continue
      }
      if (!REGEX_EMAIL.test(email)) {
        estados[reg.id] = 'EMAIL_INVALIDO'
        continue
      }
    } else if (email !== '' && !REGEX_EMAIL.test(email)) {
      estados[reg.id] = 'EMAIL_INVALIDO'
      continue
    }

    const clave = claveDedup(dni, email, criterio)
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
  estados: Record<string, TipoNovedadPreview>
): number {
  return Object.values(estados).filter((e) => e !== 'OK').length
}
