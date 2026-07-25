export type VoteErrorSeverity = 'warning' | 'error'

export type VoteTxErrorCode =
  | 'already_registered'
  | 'election_closed'
  | 'election_paused'
  | 'insufficient_funds'
  | 'invalid_proof'
  | 'invalid_signature'
  | 'merkle_root_missing'
  | 'network'
  | 'not_eligible'
  | 'retry_too_soon'
  | 'timeout'
  | 'user_rejected'
  | 'unknown'

export type OnChainRevertName =
  | 'RetryTooSoon'
  | 'InvalidSignature'
  | 'EnforcedPause'
  | 'InvalidMerkleProof'
  | 'ElectionClosed'
  | 'RevoteDisabled'
  | 'NullifierAlreadyUsed'
  | 'MerkleRootNotPublished'
  | 'MaxVotesReached'

export const VOTE_TX_FALLBACK_MESSAGE =
  'Ha ocurrido un error inesperado al procesar su voto. Por favor, verifique su conexión e intente nuevamente.'

export const VOTE_TX_MESSAGES = {
  retryTooSoon:
    'Debe esperar [X] minutos antes de volver a votar. Por favor, intente nuevamente más tarde.',
  invalidSignature:
    'La firma de su voto no es válida. Por favor, asegúrese de que su sesión esté activa y vuelva a intentar.',
  electionPaused:
    'El comicio se encuentra temporalmente pausado por medidas de seguridad. Por favor, consulte los canales oficiales.',
  notEligible:
    'Usted no se encuentra en el padrón electoral habilitado para esta elección.',
  electionClosed: 'El horario de votación ha finalizado.',
  maxVotesReached:
    'Ya utilizaste los [X] sufragios permitidos para esta elección.',
} as const

export type RevertErrorMapping = {
  code: VoteTxErrorCode
  message: string
  severity: VoteErrorSeverity
  isTransient: boolean
  canRetrySend: boolean
  canResign: boolean
}

export const buildRetryTooSoonMessage = (remainingMinutes: number): string =>
  VOTE_TX_MESSAGES.retryTooSoon.replace('[X]', String(remainingMinutes))

export const remainingSecondsToMinutes = (remainingSeconds: number): number =>
  Math.max(1, Math.ceil(remainingSeconds / 60))

export const getMessageForRevert = (
  revertName: string,
  args?: readonly unknown[]
): RevertErrorMapping | null => {
  if (revertName === 'RetryTooSoon') {
    const remainingSeconds = Number(args?.[0] ?? 60)
    const remainingMinutes = remainingSecondsToMinutes(remainingSeconds)
    return {
      code: 'retry_too_soon',
      message: buildRetryTooSoonMessage(remainingMinutes),
      severity: 'warning',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
    }
  }

  if (revertName === 'InvalidSignature') {
    return {
      code: 'invalid_signature',
      message: VOTE_TX_MESSAGES.invalidSignature,
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: true,
    }
  }

  if (revertName === 'EnforcedPause') {
    return {
      code: 'election_paused',
      message: VOTE_TX_MESSAGES.electionPaused,
      severity: 'warning',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
    }
  }

  if (revertName === 'InvalidMerkleProof') {
    return {
      code: 'not_eligible',
      message: VOTE_TX_MESSAGES.notEligible,
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: true,
    }
  }

  if (revertName === 'ElectionClosed') {
    return {
      code: 'election_closed',
      message: VOTE_TX_MESSAGES.electionClosed,
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
    }
  }

  if (
    revertName === 'RevoteDisabled' ||
    revertName === 'NullifierAlreadyUsed'
  ) {
    return {
      code: 'already_registered',
      message:
        'Este voto ya está registrado en la blockchain. No es necesario volver a enviarlo.',
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
    }
  }

  if (revertName === 'MaxVotesReached') {
    const maxVotes = Number(args?.[1] ?? 0)
    return {
      code: 'already_registered',
      message: VOTE_TX_MESSAGES.maxVotesReached.replace(
        '[X]',
        String(maxVotes)
      ),
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
    }
  }

  if (revertName === 'MerkleRootNotPublished') {
    return {
      code: 'merkle_root_missing',
      message:
        'El padrón aún no está publicado en la blockchain. Reintentá más tarde.',
      severity: 'warning',
      isTransient: false,
      canRetrySend: true,
      canResign: false,
    }
  }

  return null
}
