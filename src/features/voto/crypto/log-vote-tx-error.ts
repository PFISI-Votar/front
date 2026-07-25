import type { VoteTxErrorCode } from '@/features/voto/crypto/vote-tx-error-catalog'

export type VoteTxErrorLogContext = {
  electionId: number
  revertName?: string
  code: VoteTxErrorCode
}

export type VoteTxErrorLogPayload = {
  timestamp: string
  electionId: number
  revertName: string
  code: VoteTxErrorCode
}

export const buildVoteTxErrorLogPayload = (
  ctx: VoteTxErrorLogContext,
  timestamp: string = new Date().toISOString()
): VoteTxErrorLogPayload => ({
  timestamp,
  electionId: ctx.electionId,
  revertName: ctx.revertName ?? 'unknown',
  code: ctx.code,
})

/** VOTAR-359 UAT-03: technical log without sensitive vote material. */
export const logVoteTxError = (ctx: VoteTxErrorLogContext): void => {
  // eslint-disable-next-line no-console -- intentional diagnostic log for electoral authority
  console.error('[VOTAR vote-tx]', buildVoteTxErrorLogPayload(ctx))
}
