import { createFileRoute } from '@tanstack/react-router'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

/**
 * VOTAR-360: Ruta pública para verificación de recibos electorales.
 *
 * Ruta: /verificar
 *
 * Portal de búsqueda donde los usuarios pueden ingresar manualmente
 * el código de verificación E2E para verificar su recibo.
 */

export const Route = createFileRoute('/verificar/')({
  component: VerificadorReciboPage,
})

function VerificadorReciboPage() {
  return <VerificadorRecibo />
}
