import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  TimeoutError,
  UserRejectedRequestError,
} from 'viem'
import {
  getMessageForRevert,
  VOTE_TX_FALLBACK_MESSAGE,
  type VoteErrorSeverity,
  type VoteTxErrorCode,
} from '@/features/voto/crypto/vote-tx-error-catalog'

export type { VoteTxErrorCode } from '@/features/voto/crypto/vote-tx-error-catalog'

export type VoteTxError = {
  code: VoteTxErrorCode
  message: string
  severity: VoteErrorSeverity
  revertName?: string
  remainingSeconds?: number
  /** True when automatic retries may help (transient network). */
  isTransient: boolean
  /** True when the same signed payload can be re-sent manually. */
  canRetrySend: boolean
  /** True when the user should re-sign (new ephemeral session). */
  canResign: boolean
  cause?: unknown
}

const TRANSIENT_MESSAGE_PATTERNS = [
  /fetch failed/i,
  /network/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /timeout/i,
  /503/,
  /502/,
  /429/,
  /socket hang up/i,
  /failed to fetch/i,
]

const createVoteTxError = (
  partial: Omit<VoteTxError, 'cause'> & { cause?: unknown }
): VoteTxError => ({
  ...partial,
  severity: partial.severity ?? 'error',
  cause: partial.cause,
})

const looksLikeVoteTxError = (value: unknown): value is VoteTxError =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'code' in value &&
      typeof (value as VoteTxError).code === 'string' &&
      'message' in value &&
      'isTransient' in value &&
      'severity' in value
  )

/** AbortSignal.timeout / fetch abort — not viem mining TimeoutError. */
const isRelayerOrApiTimeout = (error: unknown): boolean => {
  if (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  ) {
    return true
  }
  // viem mining timeout is handled separately below
  if (error instanceof TimeoutError) {
    return false
  }
  if (!(error instanceof Error)) {
    return false
  }
  if (error.name === 'AbortError') {
    return true
  }
  if (
    error.name === 'TimeoutError' &&
    /timeout|timed out|aborted|signal/i.test(error.message)
  ) {
    return true
  }
  return false
}

export type RevertErrorData = {
  name: string
  args: readonly unknown[]
}

export const getRevertErrorData = (error: unknown): RevertErrorData | null => {
  if (!(error instanceof BaseError)) {
    return null
  }
  const reverted = error.walk(
    (err) => err instanceof ContractFunctionRevertedError
  )
  if (!(reverted instanceof ContractFunctionRevertedError)) {
    return null
  }
  const name = reverted.data?.errorName ?? reverted.reason
  if (!name) {
    return null
  }
  return {
    name,
    args: reverted.data?.args ?? [],
  }
}

/**
 * Maps RPC / contract failures to user-facing Spanish messages (VOTAR-358 / VOTAR-359).
 */
export const mapVoteTxError = (error: unknown): VoteTxError => {
  if (looksLikeVoteTxError(error)) {
    return error
  }

  // Axios (and similar): backend may put a VoteTxError on response.data
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data
    if (looksLikeVoteTxError(data)) {
      return data
    }
  }

  if (isRelayerOrApiTimeout(error)) {
    return createVoteTxError({
      code: 'timeout',
      message:
        'El relayer no respondió a tiempo. Reintentá el envío. Tu selección se conserva.',
      severity: 'warning',
      isTransient: true,
      canRetrySend: true,
      canResign: true,
      cause: error,
    })
  }

  if (error instanceof TimeoutError) {
    return createVoteTxError({
      code: 'timeout',
      message:
        'La transacción no fue incluida en un bloque a tiempo. Podés reintentar el envío o volver a firmar.',
      severity: 'warning',
      isTransient: true,
      canRetrySend: true,
      canResign: true,
      cause: error,
    })
  }

  if (error instanceof InsufficientFundsError) {
    return createVoteTxError({
      code: 'insufficient_funds',
      message:
        'No hay fondos suficientes para pagar el gas de la red. Contactá a la autoridad electoral o reintentá más tarde. Tu selección se conserva.',
      severity: 'error',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
      cause: error,
    })
  }

  if (error instanceof UserRejectedRequestError) {
    return createVoteTxError({
      code: 'user_rejected',
      message: 'El envío fue cancelado. Tu selección se conserva.',
      severity: 'warning',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
      cause: error,
    })
  }

  const revertData = getRevertErrorData(error)
  if (revertData) {
    const mapped = getMessageForRevert(revertData.name, revertData.args)
    if (mapped) {
      const remainingSeconds =
        revertData.name === 'RetryTooSoon'
          ? Number(revertData.args[1] ?? 0)
          : undefined
      return createVoteTxError({
        code: mapped.code,
        message: mapped.message,
        severity: mapped.severity,
        revertName: revertData.name,
        remainingSeconds,
        isTransient: mapped.isTransient,
        canRetrySend: mapped.canRetrySend,
        canResign: mapped.canResign,
        cause: error,
      })
    }
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  if (/insufficient funds|gas required exceeds/i.test(rawMessage)) {
    return createVoteTxError({
      code: 'insufficient_funds',
      message:
        'No hay fondos suficientes para pagar el gas de la red. Contactá a la autoridad electoral o reintentá más tarde. Tu selección se conserva.',
      severity: 'error',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
      cause: error,
    })
  }

  if (TRANSIENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(rawMessage))) {
    return createVoteTxError({
      code: 'network',
      message:
        'No pudimos conectar con la red blockchain. Reintentá el envío cuando recuperes la conexión. Tu selección se conserva.',
      severity: 'warning',
      isTransient: true,
      canRetrySend: true,
      canResign: true,
      cause: error,
    })
  }

  return createVoteTxError({
    code: 'unknown',
    message: VOTE_TX_FALLBACK_MESSAGE,
    severity: 'error',
    isTransient: false,
    canRetrySend: true,
    canResign: true,
    cause: error,
  })
}

export const isTransientVoteTxError = (error: unknown): boolean =>
  mapVoteTxError(error).isTransient
