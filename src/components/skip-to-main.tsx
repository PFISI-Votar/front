type SkipToMainProps = {
  /** id del elemento (normalmente el `<main>`) al que salta el enlace. */
  targetId?: string
  /** Texto visible del enlace al recibir foco. */
  label?: string
}

/**
 * Enlace "saltar al contenido" (WCAG 2.1 SC 2.4.1 Bypass Blocks). Oculto hasta
 * recibir foco por teclado; debe ser el primer elemento focusable de la página.
 */
export function SkipToMain({
  targetId = 'content',
  label = 'Saltar al contenido principal',
}: SkipToMainProps = {}) {
  return (
    <a
      className={`fixed inset-s-44 z-999 -translate-y-52 bg-primary px-4 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground opacity-95 shadow-sm transition hover:bg-primary/90 focus:translate-y-3 focus:transform focus-visible:ring-1 focus-visible:ring-ring`}
      href={`#${targetId}`}
    >
      {label}
    </a>
  )
}
