import type { ReporteNovedades } from '../api/padron-api'

/**
 * Arma el reporte de novedades en texto plano y dispara su descarga como .log.
 * Las novedades sólo contienen número de línea y motivo (sin datos personales).
 */
export function descargarReporteNovedades(reporte: ReporteNovedades): void {
  const encabezado = [
    'Reporte de novedades - Importación de padrón',
    `Elección: #${reporte.idEleccion}`,
    `Procesados: ${reporte.totalProcesados} · Importados: ${reporte.totalImportados} · Omitidos: ${reporte.totalOmitidos}`,
    '----------------------------------------',
  ]
  const cuerpo = reporte.novedades.map((novedad) => novedad.motivo)
  const contenido = [...encabezado, ...cuerpo].join('\n')

  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `reporte-novedades-padron-eleccion-${reporte.idEleccion}.log`
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
