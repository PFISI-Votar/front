export const OBSERVACION_LOGIN_MAX_LENGTH = 1000

export const OBSERVACION_LOGIN_DEFAULT =
  'El acceso se realiza con tu cuenta institucional. Para poder emitir el voto, el correo electrónico cargado en la sección Datos Personales de Autogestión debe coincidir con el registrado en el padrón electoral.'

/** `undefined` (API vieja / aún no cargó) usa el texto por defecto; vacío oculta el recuadro. */
export const resolveObservacionLoginVisible = (
  observacionLogin: string | null | undefined
): string | null => {
  if (observacionLogin === undefined) {
    return OBSERVACION_LOGIN_DEFAULT
  }
  const trimmed = observacionLogin?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}
