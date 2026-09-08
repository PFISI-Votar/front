import axe from 'axe-core'

/**
 * VOTAR-362 — auditoría automatizada de accesibilidad (UAT-01).
 *
 * Se usa `axe-core` directamente en vez de `vitest-axe`: la matcher de
 * `vitest-axe@0.1.0` está construida contra Vitest 0.17 / pretty-format@28 y no
 * es fiable en el browser mode de Vitest 4. `axe.run()` permite además fijar los
 * tags exactos del estándar exigido por la US.
 */
const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const

// Reglas de "buenas prácticas" que Lighthouse también audita (jerarquía de
// encabezados, landmarks, listas) — se exigen igual para el UAT-01.
const BEST_PRACTICE_TAGS = ['best-practice'] as const

/**
 * Ejecuta axe-core sobre `container` restringido a las reglas WCAG 2.1 A/AA
 * (más buenas prácticas de estructura) y devuelve la lista de violaciones
 * (vacía = pantalla conforme).
 */
export async function auditarAccesibilidad(
  container: Element
): Promise<axe.Result[]> {
  const resultados = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: [...WCAG_21_AA_TAGS, ...BEST_PRACTICE_TAGS],
    },
    resultTypes: ['violations'],
  })
  return resultados.violations
}

/** Formatea las violaciones de axe para que el fallo del test sea accionable. */
export function formatearViolaciones(violaciones: axe.Result[]): string {
  if (violaciones.length === 0) return 'sin violaciones'
  return violaciones
    .map((violacion) => {
      const selectores = violacion.nodes
        .map((nodo) => `      - ${nodo.target.join(' ')}`)
        .join('\n')
      return [
        `  [${violacion.impact ?? 'sin impacto'}] ${violacion.id}: ${violacion.help}`,
        `    ${violacion.helpUrl}`,
        selectores,
      ].join('\n')
    })
    .join('\n\n')
}

/**
 * Aserción de conveniencia: falla con el detalle formateado si hay violaciones.
 * Se apoya en el `expect` global de Vitest sin importarlo para no acoplar el
 * helper a un runner concreto.
 */
export async function esperarCeroViolaciones(
  container: Element
): Promise<void> {
  const violaciones = await auditarAccesibilidad(container)
  if (violaciones.length > 0) {
    throw new Error(
      `axe-core encontró ${violaciones.length} violación(es) WCAG 2.1 AA:\n\n${formatearViolaciones(
        violaciones
      )}`
    )
  }
}
