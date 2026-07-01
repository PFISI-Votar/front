import type { CampoCandidatoDefinicion } from '@/features/eleccion/candidato/data/schema'

export const formatValorCampo = (
  valor: unknown,
  tipo: CampoCandidatoDefinicion['tipo']
): string => {
  if (valor === undefined || valor === null || valor === '') {
    return '—'
  }
  if (tipo === 'booleano') {
    return valor ? 'Sí' : 'No'
  }
  return String(valor)
}

export const buildResumenDatosAdicionales = (
  datos: Record<string, unknown>,
  campos: CampoCandidatoDefinicion[]
): string => {
  const camposOrdenados = [...campos].sort((a, b) => a.orden - b.orden)
  const partes = camposOrdenados
    .map((campo) => {
      const valor = formatValorCampo(datos[campo.clave], campo.tipo)
      if (valor === '—') {
        return null
      }
      return `${campo.etiqueta}: ${valor}`
    })
    .filter((parte): parte is string => parte !== null)
  return partes.length > 0 ? partes.join(' · ') : 'Sin datos adicionales'
}
