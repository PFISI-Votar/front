import { apiClient } from '@/api/api.client';
import type { CrearEleccionDto, Eleccion } from '@/types/eleccion.types';

export async function crearEleccion(dto: CrearEleccionDto): Promise<Eleccion> {
  return apiClient<Eleccion>('/elecciones', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}