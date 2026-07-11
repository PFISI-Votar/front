import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import axe from 'axe-core'
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
  comprobanteHash:
    'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
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

  it('UAT-A11Y-01: formulario de búsqueda debe cumplir WCAG 2.1 AA', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Ejecutar análisis de accesibilidad con axe-core
    const results = await axe.run(container, {
      rules: {
        // Reglas WCAG 2.1 AA relevantes
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'input-button-name': { enabled: true },
        'label-title-only': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-A11Y-02: input debe tener label asociado correctamente', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    expect(input).toBeDefined()
    expect(input.id).toBe('codigo-verificacion')

    // Verificar que tiene aria-describedby para ayuda contextual
    expect(input.getAttribute('aria-describedby')).toBe('codigo-help')
  })

  it('UAT-A11Y-03: resultado exitoso debe cumplir WCAG 2.1 AA', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Simular ingreso de código
    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    await userEvent.fill(
      input,
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    )

    // Enviar formulario
    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    })
    await userEvent.click(submitButton)

    // Esperar resultado
    await vi.waitFor(
      async () => {
        const result = await screen.findByText(/Participación Confirmada/i)
        expect(result).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar accesibilidad del resultado
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-A11Y-04: alert de error debe ser anunciado por screen readers', async () => {
    mocks.verificarRecibo.mockRejectedValue({
      response: { status: 404 },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Enviar código inválido
    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    await userEvent.fill(
      input,
      'invalid-uuid-1234-5678-90ab-cdef1234567890ab',
    )

    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    })
    await userEvent.click(submitButton)

    // Esperar mensaje de error
    await vi.waitFor(
      async () => {
        const errorAlert = await screen.findByRole('alert')
        expect(errorAlert).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar que el alert tiene role="alert" para ARIA
    const errorAlert = screen.getByRole('alert')
    expect(errorAlert.getAttribute('role')).toBe('alert')
  })

  it('UAT-A11Y-05: botón de verificar debe estar deshabilitado apropiadamente', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    }) as HTMLButtonElement

    // Debe estar deshabilitado si no hay código
    expect(submitButton.disabled).toBe(true)

    // Debe habilitarse al ingresar código válido
    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    await userEvent.fill(
      input,
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    )

    expect(submitButton.disabled).toBe(false)
  })

  it('UAT-A11Y-06: información de privacidad debe ser clara y accesible', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Verificar que existe el card de privacidad
    const privacidadText = screen.getByText(
      /Este portal NO revela su voto ni su identidad personal/i,
    )
    expect(privacidadText).toBeDefined()

    // Verificar accesibilidad del card
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'region': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-A11Y-07: navegación por teclado debe funcionar correctamente', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    })

    // Simular navegación con Tab
    await userEvent.tab()
    expect(document.activeElement).toBe(input)

    // Ingresar código
    await userEvent.fill(
      input,
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    )

    // Tab al botón
    await userEvent.tab()
    expect(document.activeElement).toBe(submitButton)
  })

  it('UAT-A11Y-08: enlaces externos deben tener atributos de seguridad', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Verificar recibo
    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    await userEvent.fill(
      input,
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    )

    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    })
    await userEvent.click(submitButton)

    // Esperar enlace de Etherscan
    await vi.waitFor(
      async () => {
        const etherscanLink = await screen.findByRole('link', {
          name: /Ver en Explorador de Bloques/i,
        })
        expect(etherscanLink).toBeDefined()
      },
      { timeout: 3000 },
    )

    const etherscanLink = screen.getByRole('link', {
      name: /Ver en Explorador de Bloques/i,
    })

    // Verificar atributos de seguridad
    expect(etherscanLink.getAttribute('target')).toBe('_blank')
    expect(etherscanLink.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('UAT-A11Y-09: contraste de colores debe cumplir ratio 4.5:1', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // axe-core verifica automáticamente el contraste
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-A11Y-10: disclaimer de privacidad debe cumplir WCAG 2.1 AA', async () => {
    mocks.verificarRecibo.mockResolvedValue(reciboExitoso)

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VerificadorRecibo />
      </QueryClientProvider>,
    )

    // Verificar recibo
    const input = screen.getByLabelText(
      'Código de Verificación (UUID)',
    ) as HTMLInputElement
    await userEvent.fill(
      input,
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    )

    const submitButton = screen.getByRole('button', {
      name: /Verificar Comprobante/i,
    })
    await userEvent.click(submitButton)

    // Esperar disclaimer
    await vi.waitFor(
      async () => {
        const disclaimer = await screen.findByText(
          /NO revela el contenido del voto ni la identidad del votante/i,
        )
        expect(disclaimer).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar accesibilidad
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'region': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })
})
