import { z } from 'zod'

export const createCategoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().max(500).optional(),
  cantidadCargos: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'La cantidad de cargos debe ser al menos 1'),
  orden: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'El orden debe ser al menos 1'),
})

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>

export type Categoria = {
  idCategoria: number
  idBoleta: number
  nombre: string
  descripcion: string | null
  cantidadCargos: number
  orden: number
}