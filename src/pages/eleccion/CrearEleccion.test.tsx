import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CrearEleccion from './CrearEleccion';
import * as eleccionService from '@/services/eleccion.service';

vi.mock('@/services/eleccion.service');

describe('CrearEleccion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UAT-01: debe mostrar mensaje de éxito al crear comicio con datos válidos', async () => {
    vi.spyOn(eleccionService, 'crearEleccion').mockResolvedValue({
      idEleccion: 1,
      nombre: 'Elección UTN 2026',
      descripcion: '',
      fechaInicio: '2026-07-01T10:00:00.000Z',
      fechaFin: '2026-07-02T10:00:00.000Z',
      estado: 'BORRADOR',
      minimoCandidatosPorLista: null,
      fechaCreacion: '2026-06-14T00:00:00.000Z',
      fechaActualizacion: '2026-06-14T00:00:00.000Z',
    });

    render(<CrearEleccion />);

    fireEvent.change(screen.getByPlaceholderText(/Ej: Elección de autoridades UTN 2026/i), {
      target: { value: 'Elección UTN 2026', name: 'nombre' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), {
      target: { value: '2026-07-01T10:00', name: 'fechaInicio' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de cierre/i), {
      target: { value: '2026-07-02T10:00', name: 'fechaFin' },
    });

    fireEvent.click(screen.getByText('Crear comicio'));

    await waitFor(() => {
      expect(screen.getByText(/Comicio creado exitosamente en estado BORRADOR/i)).toBeInTheDocument();
    });
  });

  it('UAT-02: debe mostrar error si fecha de cierre es anterior a fecha de inicio', async () => {
    vi.spyOn(eleccionService, 'crearEleccion').mockRejectedValue({
      message: 'La fecha de cierre debe ser posterior a la fecha de inicio.',
    });

    render(<CrearEleccion />);

    fireEvent.change(screen.getByPlaceholderText(/Ej: Elección de autoridades UTN 2026/i), {
      target: { value: 'Elección UTN 2026', name: 'nombre' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), {
      target: { value: '2026-07-02T10:00', name: 'fechaInicio' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de cierre/i), {
      target: { value: '2026-07-01T10:00', name: 'fechaFin' },
    });

    fireEvent.click(screen.getByText('Crear comicio'));

    await waitFor(() => {
      expect(screen.getByText(/La fecha de cierre debe ser posterior a la fecha de inicio/i)).toBeInTheDocument();
    });
  });

  it('UAT-03: debe mostrar error si fecha de inicio está en el pasado', async () => {
    vi.spyOn(eleccionService, 'crearEleccion').mockRejectedValue({
      message: 'La fecha de inicio debe ser posterior al momento actual.',
    });

    render(<CrearEleccion />);

    fireEvent.change(screen.getByPlaceholderText(/Ej: Elección de autoridades UTN 2026/i), {
      target: { value: 'Elección UTN 2026', name: 'nombre' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), {
      target: { value: '2025-01-01T10:00', name: 'fechaInicio' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de cierre/i), {
      target: { value: '2026-07-01T10:00', name: 'fechaFin' },
    });

    fireEvent.click(screen.getByText('Crear comicio'));

    await waitFor(() => {
      expect(screen.getByText(/La fecha de inicio debe ser posterior al momento actual/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error si campos obligatorios están vacíos', async () => {
    render(<CrearEleccion />);

    fireEvent.click(screen.getByText('Crear comicio'));

    await waitFor(() => {
      expect(screen.getByText(/Los campos nombre, fecha de inicio y fecha de cierre son obligatorios/i)).toBeInTheDocument();
    });
  });
});