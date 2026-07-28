import { z } from 'zod'

export type Categoria = {
  idCategoria: number
  idBoleta: number
  nombre: string
  descripcion?: string | null
  cantidadCargos: number
  minimoPostulantes: number
  orden: number
}

export type CategoriaElectoral = {
  idCategoria: number
  nombre: string
  minimoPostulantes: number
  maximoPostulantes: number
  orden: number
}

export type CategoriaNombreContext = {
  categorias: Pick<Categoria, 'idCategoria' | 'nombre'>[]
  excludeIdCategoria?: number
}

const normalizeCategoriaNombre = (nombre: string): string =>
  nombre.trim().toLocaleLowerCase()

export const categoriaFormSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
    descripcion: z
      .string()
      .max(500, 'La descripción no puede superar los 500 caracteres')
      .optional(),
    minimoPostulantes: z
      .number()
      .int('Debe ser un número entero')
      .min(0, 'El mínimo no puede ser negativo'),
    maximoPostulantes: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'El máximo debe ser al menos 1'),
  })
  .superRefine((data, ctx) => {
    if (data.minimoPostulantes > data.maximoPostulantes) {
      ctx.addIssue({
        code: 'custom',
        message: 'El mínimo no puede ser mayor al máximo',
        path: ['minimoPostulantes'],
      })
    }
  })

export const createCategoriaFormSchema = ({
  categorias,
  excludeIdCategoria,
}: CategoriaNombreContext) =>
  categoriaFormSchema.superRefine((data, ctx) => {
    const nombreNormalizado = normalizeCategoriaNombre(data.nombre)
    const categoriaDuplicada = categorias.find(
      (categoria) =>
        categoria.idCategoria !== excludeIdCategoria &&
        normalizeCategoriaNombre(categoria.nombre) === nombreNormalizado
    )
    if (categoriaDuplicada) {
      ctx.addIssue({
        code: 'custom',
        message: `Ya existe una categoría con el nombre "${categoriaDuplicada.nombre}" en este comicio.`,
        path: ['nombre'],
      })
    }
  })

export type CategoriaFormInput = z.infer<typeof categoriaFormSchema>

export const mapCategoriaToElectoral = (
  categoria: Categoria
): CategoriaElectoral => ({
  idCategoria: categoria.idCategoria,
  nombre: categoria.nombre,
  minimoPostulantes: categoria.minimoPostulantes,
  maximoPostulantes: categoria.cantidadCargos,
  orden: categoria.orden,
})
