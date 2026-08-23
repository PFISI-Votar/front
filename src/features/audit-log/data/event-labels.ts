import type { TipoEventoAudit } from '@/features/audit-log/data/schema'

export type AuditEventLabel = {
  value: TipoEventoAudit
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const AUDIT_EVENT_LABELS: AuditEventLabel[] = [
  {
    value: 'LOGIN',
    label: 'Inicio de sesión',
    variant: 'default',
  },
  {
    value: 'ACCESO_DENEGADO',
    label: 'Acceso denegado',
    variant: 'destructive',
  },
  {
    value: 'PADRON_CARGADO',
    label: 'Carga de padrón',
    variant: 'secondary',
  },
  {
    value: 'COMICIO_ABIERTO',
    label: 'Apertura de comicio',
    variant: 'default',
  },
  {
    value: 'COMICIO_CERRADO',
    label: 'Cierre de comicio',
    variant: 'outline',
  },
  {
    value: 'COMICIO_ARCHIVADO',
    label: 'Archivado de comicio',
    variant: 'outline',
  },
  {
    value: 'COMICIO_PAUSADO',
    label: 'Pausa de emergencia',
    variant: 'destructive',
  },
  {
    value: 'COMICIO_REANUDADO',
    label: 'Reanudación de comicio',
    variant: 'default',
  },
  {
    value: 'VOTO_EMITIDO',
    label: 'Voto emitido (anónimo)',
    variant: 'secondary',
  },
  {
    value: 'CONFIG_MODIFICADA',
    label: 'Configuración modificada',
    variant: 'outline',
  },
  {
    value: 'ACTA_CIERRE_GENERADA',
    label: 'Acta de cierre generada',
    variant: 'secondary',
  },
]

export const CRITICAL_EVENT_TYPES: TipoEventoAudit[] = [
  'COMICIO_ABIERTO',
  'COMICIO_CERRADO',
  'COMICIO_ARCHIVADO',
  'PADRON_CARGADO',
  'COMICIO_PAUSADO',
  'COMICIO_REANUDADO',
  'ACTA_CIERRE_GENERADA',
]

export const getAuditEventLabel = (
  tipoEvento: TipoEventoAudit
): AuditEventLabel => {
  return (
    AUDIT_EVENT_LABELS.find((item) => item.value === tipoEvento) ?? {
      value: tipoEvento,
      label: tipoEvento,
      variant: 'outline',
    }
  )
}

export const AUDIT_PAGE_SIZES = [25, 50, 100, 200] as const
