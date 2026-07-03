import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TotalVotantesCard } from './total-votantes-card'

const { useTotalVotantesPublicoMock } = vi.hoisted(() => ({
  useTotalVotantesPublicoMock: vi.fn(),
}))

vi.mock('@/features/padron/hooks/use-padron', () => ({
  useTotalVotantesPublico: useTotalVotantesPublicoMock,
}))

async function renderCard(idEleccion = 6) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <TotalVotantesCard idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('TotalVotantesCard', () => {
  it('muestra el estado de carga mientras isLoading es true', async () => {
    useTotalVotantesPublicoMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    const screen = await renderCard()

    await expect
      .element(screen.getByText(/Cargando total de votantes/i))
      .toBeInTheDocument()
  })

  it('muestra "padrón aún no consolidado" cuando hay error (404)', async () => {
    useTotalVotantesPublicoMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    const screen = await renderCard()

    await expect
      .element(screen.getByText(/Padrón aún no consolidado/i))
      .toBeInTheDocument()
  })

  it('muestra el total de votantes habilitados cuando la consulta es exitosa', async () => {
    useTotalVotantesPublicoMock.mockReturnValue({
      data: { totalVotantesHabilitados: 1500 },
      isLoading: false,
      isError: false,
    })

    const screen = await renderCard()

    await expect
      .element(screen.getByText(/Votantes habilitados/i))
      .toBeInTheDocument()
    await expect.element(screen.getByText('1.500')).toBeInTheDocument()
  })
})