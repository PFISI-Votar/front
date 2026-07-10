import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { calcularNullifier } from './nullifier'

/**
 * Harness mínimo que reproduce el patrón de encapsulamiento esperado en
 * la integración real (VOTAR-352 + `bud-voting-wizard.tsx`): el
 * nulificador se calcula y se guarda únicamente en un closure/ref local
 * de React, sin exponerlo en props, atributos del DOM, ni en `window`.
 *
 * No es parte del código de producción — vive solo en este archivo de
 * test para validar UAT-04 de forma automatizada mientras la
 * integración real en el wizard sigue pendiente de VOTAR-352.
 *
 * `calcularNullifier` es sincrónica y pura, así que se calcula directo
 * durante el render (perezosamente, una sola vez vía el ref) en vez de
 * en un `useEffect` con `setState` — evita cascading renders
 * innecesarios (react-hooks/set-state-in-effect).
 */
const CREDENCIAL_MOCK =
  '0x04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c'
const ID_ELECCION_MOCK = 12

function ComponenteConNullifierEncapsulado() {
  const nullifierRef = useRef<string | null>(null)
  if (nullifierRef.current === null) {
    nullifierRef.current = calcularNullifier(CREDENCIAL_MOCK, ID_ELECCION_MOCK)
  }

  return <div data-testid='estado-nullifier'>Nulificador calculado</div>
}

describe('UAT-04 (Protección XSS): el nulificador no es accesible desde la consola', () => {
  it('no queda expuesto en window/globalThis luego de calcularse', async () => {
    const nullifierEsperado = calcularNullifier(
      CREDENCIAL_MOCK,
      ID_ELECCION_MOCK
    )

    const screen = await render(<ComponenteConNullifierEncapsulado />)

    await expect
      .element(screen.getByTestId('estado-nullifier'))
      .toHaveTextContent('Nulificador calculado')

    const clavesGlobales = JSON.stringify(Object.keys(window))
    expect(clavesGlobales).not.toContain(nullifierEsperado)
    // @ts-expect-error - acceso intencional para verificar ausencia en window
    expect(window[nullifierEsperado]).toBeUndefined()
  })

  it('no queda expuesto en el DOM renderizado', async () => {
    const nullifierEsperado = calcularNullifier(
      CREDENCIAL_MOCK,
      ID_ELECCION_MOCK
    )

    const screen = await render(<ComponenteConNullifierEncapsulado />)

    await expect
      .element(screen.getByTestId('estado-nullifier'))
      .toBeInTheDocument()

    expect(document.body.innerHTML).not.toContain(nullifierEsperado)
  })
})
