# VOTAR-408 — Confirmación por nombre al eliminar comicio

**Jira:** [VOTAR-408](https://fivestack.atlassian.net/browse/VOTAR-408)  
**Tipo:** Error / mejora UX  
**Fecha:** 2026-07-16  
**Repo afectado:** `front`  
**Relacionado:** VOTAR-407 (confirmación simple al eliminar lista — ya finalizado)

## Problema

Al eliminar un comicio, el diálogo actual solo pide un clic en “Sí, eliminar comicio”. Eso es insuficiente para una acción irreversible que borra listas, candidatos y configuración. El ticket pide un input que habilite el botón, tomando como referencia borrar un repositorio en GitHub.

## Objetivo

Exigir que la autoridad escriba el **nombre exacto del comicio** para habilitar el botón de eliminar, en ambas pantallas donde existe esa acción.

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Texto a tipear | Nombre exacto del comicio (case-sensitive) |
| Alcance UI | Lista de comicios + detalle/oferta electoral |
| Arquitectura | Componente reutilizable `EliminarComicioDialog` |
| Match | Igualdad exacta con `nombreEleccion` (sin normalización de mayúsculas) |
| Backend / Swagger / diagramas | Sin cambios |

## UX

1. Usuario abre “Eliminar comicio”.
2. Diálogo muestra:
   - Título: `¿Eliminar el comicio?`
   - Aviso de irreversibilidad y consecuencias (listas, candidatos, configuraciones).
   - Nombre del comicio en negrita.
   - Instrucción: escribir el nombre exacto para confirmar.
   - Input con `autoFocus`.
3. Botón `Sí, eliminar comicio` permanece `disabled` hasta que el valor del input sea **igual** a `nombreEleccion`.
4. Cancelar o cerrar limpia el input y no llama a la API.
5. Con match correcto + confirmar → se ejecuta `eliminarEleccion(id)` (flujo existente).

## Componentes

### Nuevo: `src/features/eleccion/components/eliminar-comicio-dialog.tsx`

Props:

```ts
type EliminarComicioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nombreEleccion: string
  isLoading?: boolean
  onConfirm: () => void
}
```

Comportamiento interno:

- Estado local del texto del input.
- Reutiliza `ConfirmDialog` con `form` + `disabled` (mismo patrón que `tasks-multi-delete-dialog` / `users-multi-delete-dialog`).
- `disabled={value !== nombreEleccion}`.
- Al pasar `open` de `true` → `false`, resetear el input.
- Accesibilidad: `Label` asociado al input, `aria-label` claro.

### Modificados

- `src/features/eleccion/components/comicios-list.tsx` — reemplazar el `ConfirmDialog` de eliminar por `EliminarComicioDialog`.
- `src/features/eleccion/lista/components/oferta-electoral-panel.tsx` — idem.

### Sin cambios

- `ConfirmDialog` base (no se agrega API genérica `confirmPhrase` en este ticket).
- Backend NestJS, blockchain, diagramas.

## Flujo de datos

```
[Lista | Oferta electoral]
  → open EliminarComicioDialog(nombreEleccion)
  → usuario tipea nombre
  → onConfirm()
  → eliminarEleccion(id) (React Query mutation existente)
  → toast + invalidación / navegación (sin cambios)
```

## Tests

### `eliminar-comicio-dialog.test.tsx`

- Confirm deshabilitado con input vacío.
- Confirm deshabilitado con texto incorrecto.
- Con nombre exacto: confirm habilitado; click llama `onConfirm`.
- Al cerrar/cancelar: input limpio en la siguiente apertura.
- Con `isLoading`: cancel y confirm deshabilitados.

### Actualizar `comicios-list.test.tsx`

- Caso feliz: tipear nombre → confirmar → `eliminarEleccion(id)`.
- Sin nombre correcto: no llama a la API.

### `oferta-electoral-panel.test.tsx`

- Agregar caso feliz: abrir eliminar comicio → tipear nombre → confirmar → `eliminarEleccion(id)`.
- Agregar caso negativo: sin nombre correcto el botón permanece deshabilitado y no se llama a la API.

## Criterios de aceptación (derivados del ticket)

1. Al eliminar un comicio aparece un input de confirmación.
2. El botón de eliminar solo se habilita al escribir el nombre exacto del comicio.
3. El comportamiento aplica en lista de comicios y en oferta electoral.
4. Cancelar no elimina ni deja estado sucio en el diálogo.

## Fuera de alcance

- Confirmación por nombre al eliminar lista (VOTAR-407).
- Cambios de reglas de negocio o permisos de borrado en backend.
- Soft-delete o papelera.

## Branching y commits (cuando se implemente)

- Rama: `fix/votar-408-eliminar-comicio-confirmacion`
- Commits sugeridos (solo si el usuario los pide):
  - `fix(frontend): add name confirmation when deleting election`
  - `test(frontend): cover delete election name confirmation`

## Verificación

- `npm run test` (casos del diálogo y lista)
- `npm run lint`
- Prueba manual: eliminar desde lista y desde oferta electoral
