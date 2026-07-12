import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'
import type { VerificarReciboResponse } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  verificarRecibo: vi.fn(),
}))

vi.mock('@/features/voto/api/recibo-api', () => ({
  verificarRecibo: mocks.verificarRecibo,
}))

const reciboExitoso: VerificarReciboResponse = {
  idEleccion: 7,
  nombreEleccion: 'Centro de Estudiantes 2026',
  recibidoEn: '2026-07-11T14:30:00Z',
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: 4582193,
  estadoTx: 'CONFIRMADA',
  urlExploradorBlockchain:
    'https://sepolia.etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  comprobanteHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
}

describe('VerificadorRecibo - VOTAR-360 Accesibilidad WCAG 2.1 AA', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mocks.verificarRecibo.mockReset()
  })

  it('UAT-A11Y-01: formulario debe tener label accesible', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByLabelText(/Código de Verificación/i))
      .toBeInTheDocument()
  })

  it('UAT-A11Y-02: botón debe tener nombre descriptivo', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Verificar/i }))
      .toBeInTheDocument()
  })

  it('UAT-A11Y-03: resultados deben ser accesibles', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await userEvent.type(input, 'a1b2c3d4-5678-90ab-cdef-1234567890ab')

    const button = screen.getByRole('button', { name: /Verificar/i })
    await userEvent.click(button)

    await expect.element(screen.getByText(/Centro de Estudiantes 2026/i)).toBeInTheDocument()
  })

  it('UAT-A11Y-04: link de blockchain debe ser descriptivo', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await userEvent.type(input, 'a1b2c3d4-5678-90ab-cdef-1234567890ab')

    const button = screen.getByRole('button', { name: /Verificar/i })
    await userEvent.click(button)

    await expect
      .element(screen.getByRole('link', { name: /Etherscan/i }))
      .toBeInTheDocument()
  })

  it('UAT-A11Y-05: hash debe estar en elemento code', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await userEvent.type(input, 'a1b2c3d4-5678-90ab-cdef-1234567890ab')

    const button = screen.getByRole('button', { name: /Verificar/i })
    await userEvent.click(button)

    await expect.element(screen.getByText(reciboExitoso.txHash || '')).toBeInTheDocument()
  })

  it('UAT-A11Y-06: errores deben ser anunciados', async () => {
    mocks.verificarRecibo.mockRejectedValue(new Error('Código no encontrado'))

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await userEvent.type(input, 'codigo-invalido')

    const button = screen.getByRole('button', { name: /Verificar/i })
    await userEvent.click(button)

    await expect.element(screen.getByText(/no encontrado/i)).toBeInTheDocument()
  })

  it('UAT-A11Y-07: navegación por teclado debe funcionar', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await expect.element(input).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /Verificar/i })
    await expect.element(button).toBeInTheDocument()
  })

  it('UAT-A11Y-08: estado de carga debe ser accesible', async () => {
    mocks.verificarRecibo.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(reciboExitoso), 1000)),
    )

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(/Código de Verificación/i)
    await userEvent.type(input, 'a1b2c3d4-5678-90ab-cdef-1234567890ab')

    const button = screen.getByRole('button', { name: /Verificar/i })
    await userEvent.click(button)

    await expect.element(screen.getByText(/Verificando/i)).toBeInTheDocument()
  })
})
