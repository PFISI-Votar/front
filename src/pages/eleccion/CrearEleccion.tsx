import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { crearEleccion } from '@/services/eleccion.service';
import type { CrearEleccionDto } from '@/types/eleccion.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CrearEleccion() {
  const [form, setForm] = useState<CrearEleccionDto>({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!form.nombre || !form.fechaInicio || !form.fechaFin) {
      setError('Los campos nombre, fecha de inicio y fecha de cierre son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await crearEleccion(form);
      setSuccess(true);
      setForm({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '' });
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error al crear el comicio.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Crear nuevo comicio</CardTitle>
          <CardDescription>
            Completá los datos para inicializar el proceso electoral en estado borrador.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700">
              ¡Comicio creado exitosamente en estado BORRADOR!
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="text-sm font-medium">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Elección de autoridades UTN 2026"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción opcional del comicio"
              rows={3}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fechaInicio" className="text-sm font-medium">Fecha de inicio *</label>
            <input
              id="fechaInicio"
              type="datetime-local"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fechaFin" className="text-sm font-medium">Fecha de cierre *</label>
            <input
              id="fechaFin"
              type="datetime-local"
              name="fechaFin"
              value={form.fechaFin}
              onChange={handleChange}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear comicio'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}