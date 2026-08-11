import { publicApiClient } from '@/lib/public-api-client'

export type TransaccionBlockchainPublica = {
  hashTransaccion: string
  numeroBloque: number
  marcaTiempo: string
  contratoEtiqueta: string
  nombreEvento: string
  descripcionLegible: string
  explorerUrl: string
}

export type TransaccionesPublica = {
  idEleccion: number
  snapshotCongelado: boolean
  red: string
  chainId: number
  transacciones: TransaccionBlockchainPublica[]
  fuenteDatos: string
}

export const obtenerTransaccionesPublica = async (
  idEleccion: number
): Promise<TransaccionesPublica> => {
  const { data } = await publicApiClient.get<TransaccionesPublica>(
    `/elecciones/${idEleccion}/transacciones-publica`
  )
  return data
}
