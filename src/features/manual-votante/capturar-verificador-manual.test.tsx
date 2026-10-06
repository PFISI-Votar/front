/**
 * VOTAR-389 / UAT-02 — Captura del verificador (inclusión confirmada).
 * Solo a demanda: describe.skipIf(!REGENERATE).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles/index.css'
import { toCanvas } from 'html-to-image'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { commands, page, userEvent } from 'vitest/browser'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

const REGENERATE = false
const CAPTURE_VIEWPORT = { width: 390, height: 844 } as const

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const captureMain = async (filename: string, settleMs = 800) => {
  await sleep(settleMs)
  await document.fonts.ready
  const main = document.querySelector('main')
  expect(main).toBeTruthy()
  const el = main as HTMLElement
  window.scrollTo(0, 0)
  el.scrollIntoView({ block: 'start' })

  const prevMinHeight = el.style.minHeight
  const prevOverflow = el.style.overflow
  const prevHeight = el.style.height
  el.style.minHeight = '0'
  el.style.overflow = 'visible'
  el.style.height = 'auto'

  // Espacio real en el DOM para que la sombra de la última card no se recorte
  // al medir scrollHeight / rasterizar.
  const spacer = document.createElement('div')
  spacer.setAttribute('data-manual-capture-spacer', 'true')
  spacer.style.cssText =
    'height:3rem;width:100%;flex-shrink:0;pointer-events:none;'
  el.appendChild(spacer)
  await sleep(200)

  const pixelRatio = 2
  const bottomPadCss = 64
  const width = Math.ceil(el.scrollWidth)
  const contentHeight = Math.ceil(el.scrollHeight)

  const source = await toCanvas(el, {
    pixelRatio,
    backgroundColor: '#fdfcfa',
    cacheBust: true,
    width,
    height: contentHeight,
    style: {
      minHeight: '0px',
      overflow: 'visible',
      height: `${contentHeight}px`,
    },
  })

  spacer.remove()
  el.style.minHeight = prevMinHeight
  el.style.overflow = prevOverflow
  el.style.height = prevHeight

  // Margen crema extra bajo el contenido (figcaption del manual no lo “come”).
  const padPx = bottomPadCss * pixelRatio
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height + padPx
  const ctx = canvas.getContext('2d')
  expect(ctx).toBeTruthy()
  ctx!.fillStyle = '#fdfcfa'
  ctx!.fillRect(0, 0, canvas.width, canvas.height)
  ctx!.drawImage(source, 0, 0)

  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  expect(base64.length).toBeGreaterThan(1000)
  await commands.writeFile(
    `public/manual-votante/${filename}`,
    base64,
    'base64'
  )
}

const verificarInclusionMock = vi.fn()

vi.mock('@/features/voto/crypto/verificar-voto-inclusion', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/voto/crypto/verificar-voto-inclusion')
  >('@/features/voto/crypto/verificar-voto-inclusion')
  return {
    ...actual,
    verificarInclusionVotoLocal: (...args: unknown[]) =>
      verificarInclusionMock(...args),
  }
})

describe.skipIf(!REGENERATE)(
  'VOTAR-389: captura verificador manual votante',
  () => {
    beforeEach(async () => {
      verificarInclusionMock.mockReset()
      document.documentElement.classList.remove('dark')
      await page.viewport(CAPTURE_VIEWPORT.width, CAPTURE_VIEWPORT.height)
    })

    it('captura inclusión confirmada', async () => {
      const txHash = `0x${'ab'.repeat(32)}`
      verificarInclusionMock.mockResolvedValue({
        confirmado: true,
        idEleccion: 7,
        txHash,
        blockNumber: 4582193,
        timestamp: '2026-07-11T14:30:00.000Z',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        networkName: 'Sepolia',
        mensaje:
          'Su voto ha sido incluido con éxito en el bloque número 4582193 de la blockchain de Sepolia',
      })

      const client = new QueryClient({
        defaultOptions: {
          mutations: { retry: false },
          queries: { retry: false },
        },
      })
      const screen = await render(
        <QueryClientProvider client={client}>
          <VerificadorRecibo />
        </QueryClientProvider>
      )

      await expect
        .element(screen.getByText('Verificador de voto individual'))
        .toBeInTheDocument()

      await userEvent.type(
        screen.getByLabelText(/transactionhash de verificación/i),
        txHash
      )
      await userEvent.click(
        screen.getByRole('button', { name: /verificar inclusión/i })
      )

      await expect
        .element(screen.getByText(/Inclusión confirmada/i))
        .toBeInTheDocument()

      await captureMain('05-verificacion.png', 1500)
    }, 60_000)
  }
)
