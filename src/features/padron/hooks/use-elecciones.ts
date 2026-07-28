import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Eleccion {
  idEleccion: number
  nombre: string
  estado: string
}

/** Obtiene el listado de comicios para seleccionar al importar el padrón. */
export function useElecciones(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['elecciones'],
    queryFn: async () => {
      const { data } = await apiClient.get<Eleccion[]>('/elecciones')
      return data
    },
    enabled: options?.enabled ?? true,
  })
}
