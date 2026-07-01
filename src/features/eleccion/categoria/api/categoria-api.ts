import { apiClient } from '@/lib/api-client'
import type {
  Categoria,
  CategoriaFormInput,
} from '@/features/eleccion/categoria/data/schema'

export const listarCategorias = async (
  idEleccion: number
): Promise<Categoria[]> => {
  const { data } = await apiClient.get<Categoria[]>(
    `/elecciones/${idEleccion}/categorias`
  )
  return data
}

export const crearCategoria = async (
  idEleccion: number,
  input: CategoriaFormInput
): Promise<Categoria> => {
  const { data } = await apiClient.post<Categoria>(
    `/elecciones/${idEleccion}/categorias`,
    input
  )
  return data
}

export const actualizarCategoria = async (
  idEleccion: number,
  idCategoria: number,
  input: Partial<CategoriaFormInput>
): Promise<Categoria> => {
  const { data } = await apiClient.patch<Categoria>(
    `/elecciones/${idEleccion}/categorias/${idCategoria}`,
    input
  )
  return data
}

export const eliminarCategoria = async (
  idEleccion: number,
  idCategoria: number
): Promise<void> => {
  await apiClient.delete(`/elecciones/${idEleccion}/categorias/${idCategoria}`)
}
