import { apiClient } from '@/lib/api-client'
import type { Categoria, CreateCategoriaInput } from '@/features/eleccion/categoria/data/schema'

export const listarCategorias = async (idEleccion: number): Promise<Categoria[]> => {
  const { data } = await apiClient.get<Categoria[]>(
    `/elecciones/${idEleccion}/categorias`,
  )
  return data
}

export const crearCategoria = async (
  idEleccion: number,
  input: CreateCategoriaInput,
): Promise<Categoria> => {
  const { data } = await apiClient.post<Categoria>(
    `/elecciones/${idEleccion}/categorias`,
    input,
  )
  return data
}