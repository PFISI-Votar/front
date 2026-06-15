export interface CrearEleccionDto {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface Eleccion {
  idEleccion: number;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  minimoCandidatosPorLista: number | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}