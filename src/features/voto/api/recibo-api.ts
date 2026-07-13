import type {
  FirmarReciboResponse,
  VerificarReciboResponse,
} from '@/features/voto/data/schema'

const getBaseUrl = (): string =>
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) {
      return body.message.join(', ')
    }
    if (typeof body.message === 'string') {
      return body.message
    }
  } catch {
    // ignore JSON parse errors
  }
  return `Error del servidor (${response.status})`
}

/**
 * VOTAR-360: public receipt API (no cookies / no JWT).
 */
export async function verificarRecibo(
  txHash: string
): Promise<VerificarReciboResponse> {
  const response = await fetch(
    `${getBaseUrl()}/recibos/verificar/${encodeURIComponent(txHash)}`,
    {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    }
  )
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response.json() as Promise<VerificarReciboResponse>
}

export async function firmarRecibo(input: {
  idEleccion: number
  txHash: string
  blockNumber: number
  timestamp: string
}): Promise<FirmarReciboResponse> {
  const response = await fetch(`${getBaseUrl()}/recibos/firmar`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response.json() as Promise<FirmarReciboResponse>
}
