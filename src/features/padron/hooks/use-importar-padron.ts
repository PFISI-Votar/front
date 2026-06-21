import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface NovedadPadron {
  linea: number
  tipo: string
  motivo: string
}

export interface ImportarPadronResponse {
  idPadron: number | null
  idEleccion: number
  totalProcesados: number
  totalImportados: number
  totalOmitidos: number
  novedades: NovedadPadron[]
  estado: string | null
  fechaGeneracion: string | null
}

interface ImportarPadronVariables {
  idEleccion: number
  archivo: File
}

/** Sube el CSV del padrón al backend, que hashea cada identidad con Keccak-256. */
export function useImportarPadron() {
  return useMutation({
    mutationFn: async ({ idEleccion, archivo }: ImportarPadronVariables) => {
      const formData = new FormData()
      formData.append('file', archivo)

      // El cliente global fija Content-Type: application/json por defecto, lo
      // que serializaría el FormData a "{}". Lo anulamos para que axios detecte
      // el FormData y arme el multipart/form-data con su boundary.
      const { data } = await apiClient.post<ImportarPadronResponse>(
        `/elecciones/${idEleccion}/padron/import`,
        formData,
        { headers: { 'Content-Type': undefined } }
      )
      return data
    },
    // El error se maneja en el caller (mutate({ onError })). Definir onError a
    // nivel useMutation anula el handler global por defecto, que de lo
    // contrario dispararía un toast genérico "Something went wrong" extra.
    onError: () => {},
  })
}
