import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  TimeoutError,
  UserRejectedRequestError,
} from 'viem'

export type VoteTxErrorCode =
  | 'already_registered'
  | 'insufficient_funds'
  | 'invalid_proof'
  | 'invalid_signature'
  | 'merkle_root_missing'
  | 'network'
  | 'timeout'
  | 'user_rejected'
  | 'unknown'

export type VoteTxError = {
  code: VoteTxErrorCode
  message: string
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
  cause: partial.cause,
})

const getRevertErrorName = (error: unknown): string | null => {
  if (!(error instanceof BaseError)) {
    return null
  }
  const reverted = error.walk(
    (err) => err instanceof ContractFunctionRevertedError
  )
  if (!(reverted instanceof ContractFunctionRevertedError)) {
    return null
  }
  return reverted.data?.errorName ?? reverted.reason ?? null
}

/**
 * Maps RPC / contract failures to user-facing Spanish messages (VOTAR-358).
 * Exhaustive UX copy belongs to VOTAR-359; this covers acceptance criteria only.
 */
export const mapVoteTxError = (error: unknown): VoteTxError => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as VoteTxError).code === 'string' &&
    'message' in error &&
    'isTransient' in error
  ) {
    return error as VoteTxError
  }

  if (error instanceof TimeoutError) {
    return createVoteTxError({
      code: 'timeout',
      message:
        'La transacción no fue incluida en un bloque a tiempo. Podés reintentar el envío o volver a firmar.',
      isTransient: false,
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
      isTransient: false,
      canRetrySend: true,
      canResign: false,
      cause: error,
    })
  }

  const revertName = getRevertErrorName(error)
  // VOTAR-341: RevoteDisabled replaces NullifierAlreadyUsed when revote is off.
  if (revertName === 'RevoteDisabled' || revertName === 'NullifierAlreadyUsed') {
    return createVoteTxError({
      code: 'already_registered',
      message:
        'Este voto ya está registrado en la blockchain. No es necesario volver a enviarlo.',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
      cause: error,
    })
  }
  if (revertName === 'InvalidMerkleProof') {
    return createVoteTxError({
      code: 'invalid_proof',
      message:
        'La prueba de padrón no es válida. Volvé a verificar tu identidad e intentá de nuevo.',
      isTransient: false,
      canRetrySend: false,
      canResign: true,
      cause: error,
    })
  }
  if (revertName === 'InvalidSignature') {
    return createVoteTxError({
      code: 'invalid_signature',
      message:
        'La firma del voto no es válida. Volvé a firmar e intentá el envío otra vez.',
      isTransient: false,
      canRetrySend: false,
      canResign: true,
      cause: error,
    })
  }
  if (revertName === 'MerkleRootNotPublished') {
    return createVoteTxError({
      code: 'merkle_root_missing',
      message:
        'El padrón aún no está publicado en la blockchain. Reintentá más tarde.',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
      cause: error,
    })
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
      isTransient: true,
      canRetrySend: true,
      canResign: true,
      cause: error,
    })
  }

  return createVoteTxError({
    code: 'unknown',
    message:
      'No pudimos registrar el voto en la blockchain. Reintentá el envío. Tu selección se conserva.',
    isTransient: false,
    canRetrySend: true,
    canResign: true,
    cause: error,
  })
}

export const isTransientVoteTxError = (error: unknown): boolean =>
  mapVoteTxError(error).isTransient
