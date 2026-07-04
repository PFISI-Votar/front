import { createFileRoute } from '@tanstack/react-router'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

/**
 * VOTAR-360: Ruta pública para verificación de recibos electorales.
 *
 * Ruta: /verificar/:codigo
 * Ejemplo: /verificar/a1b2c3d4-5678-90ab-cdef-1234567890ab
 *
 * Esta ruta es pública (no requiere autenticación) para permitir
 * verificación independiente por fiscales, auditores y ciudadanos.
 */

export const Route = createFileRoute('/verificar/$codigo')({
  component: VerificadorReciboPage,
})

function VerificadorReciboPage() {
  return <VerificadorRecibo />
}
