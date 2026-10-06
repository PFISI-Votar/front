import type { Hex } from 'viem'
import { PENDING_VOTE_CAST_MAX_AGE_MS } from '@/features/voto/crypto/constants'

const STORAGE_PREFIX = 'votar:pending-vote-cast:'

export type PendingVoteCast = {
  idEleccion: number
  txHash: Hex
  startedAt: number
}

const storageKey = (idEleccion: number): string =>
  `${STORAGE_PREFIX}${idEleccion}`

const isHexTxHash = (value: unknown): value is Hex =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value)

/**
 * VOTAR-445 — Persists an in-flight castSignedVote hash so a reload (F5 / tab
 * restore) can wait for the receipt and finish off-chain consumo/success.
 * Uses localStorage (not sessionStorage) so closing the tab does not drop the
 * pending cast while the voter cookie may still be valid.
 */
export const savePendingVoteCast = (idEleccion: number, txHash: Hex): void => {
  const payload: PendingVoteCast = {
    idEleccion,
    txHash,
    startedAt: Date.now(),
  }
  globalThis.localStorage.setItem(
    storageKey(idEleccion),
    JSON.stringify(payload)
  )
}

export const loadPendingVoteCast = (
  idEleccion: number
): PendingVoteCast | null => {
  const raw = globalThis.localStorage.getItem(storageKey(idEleccion))
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PendingVoteCast>
    if (
      parsed.idEleccion !== idEleccion ||
      !isHexTxHash(parsed.txHash) ||
      typeof parsed.startedAt !== 'number'
    ) {
      clearPendingVoteCast(idEleccion)
      return null
    }
    if (Date.now() - parsed.startedAt > PENDING_VOTE_CAST_MAX_AGE_MS) {
      clearPendingVoteCast(idEleccion)
      return null
    }
    return {
      idEleccion,
      txHash: parsed.txHash,
      startedAt: parsed.startedAt,
    }
  } catch {
    return null
  }
}

export const clearPendingVoteCast = (idEleccion: number): void => {
  globalThis.localStorage.removeItem(storageKey(idEleccion))
}
