export type ActaAperturaPlantilla = {
  incluirDescripcion: boolean
  incluirDatosApertura: boolean
  incluirResumenPadron: boolean
  incluirOfertaElectoral: boolean
  incluirVerificacionCriptografica: boolean
  incluirLogo: boolean
}

export type ActaAperturaModo = 'SIMPLE' | 'PERSONALIZADO'

export type ActaCierrePlantilla = {
  incluirDescripcion: boolean
  incluirParticipacion: boolean
  incluirResultadosPorLista: boolean
  incluirVerificacionCriptografica: boolean
  incluirLogo: boolean
}

/** VOTAR-492 §12.2 — alcance del bloqueo de flujos de autenticación. */
export type AuthBloqueoAlcance = 'NINGUNO' | 'ADMIN' | 'TODOS'

export type ConfiguracionSistema = {
  logoUrl: string | null
  actaAperturaPlantilla: ActaAperturaPlantilla
  actaAperturaModo: ActaAperturaModo
  actaAperturaPlantillaTexto: string | null
  actaCierrePlantilla: ActaCierrePlantilla
  actaCierreModo: ActaAperturaModo
  actaCierrePlantillaTexto: string | null
  fechaActualizacion: string
  authBloqueoAlcance: AuthBloqueoAlcance
  authBloqueoMotivo: string | null
  authBloqueoDesde: string | null
  authBloqueoPor: string | null
}
