export type ActaAperturaPlantilla = {
  incluirDescripcion: boolean
  incluirDatosApertura: boolean
  incluirResumenPadron: boolean
  incluirOfertaElectoral: boolean
  incluirVerificacionCriptografica: boolean
  incluirLogo: boolean
}

export type ActaAperturaModo = 'SIMPLE' | 'PERSONALIZADO'

export type ConfiguracionSistema = {
  logoUrl: string | null
  actaAperturaPlantilla: ActaAperturaPlantilla
  actaAperturaModo: ActaAperturaModo
  actaAperturaPlantillaTexto: string | null
  fechaActualizacion: string
}
