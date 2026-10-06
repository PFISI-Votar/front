/**
 * VOTAR-449 — Reloj de cooldown anclado al nodo, sin reinicios espurios.
 *
 * `getVoterState().cooldownRemaining` es un snapshot contra `block.timestamp`.
 * Si el RPC no produce bloques nuevos, ese snapshot no decrementa aunque el
 * wall-clock avance; re-anclar el contador de la BUD a cada refetch reinicia
 * el countdown (p. ej. otra vez en 20s). También pasa al pasar del advisory
 * off-chain al on-chain con un remaining mayor por el mismo motivo.
 *
 * Estrategia: guardar `unlockAt` absoluto en el reloj del nodo y extrapolar
 * `block.timestamp` con el wall-clock desde la última observación. Solo se
 * actualiza la observación cuando el nodo avanza o hay un voto nuevo
 * (`lastVoteAt` distinto).
 */

export type CooldownAnchor = {
  /** Instantánea de desbloqueo en segundos unix del nodo. */
  unlockAtNodeSeconds: number
  /** `block.timestamp` visto al observar el ancla. */
  observedBlockTimestamp: number
  /** `Date.now()` al observar ese `block.timestamp`. */
  observedAtWallMs: number
  /**
   * `lastVoteAt` on-chain (0 si el ancla vino solo del backend).
   * Cambia cuando el votante emite un nuevo sufragio → reset legítimo.
   */
  lastVoteAt: number
}

export type VoterStateCooldownInput = {
  lastVoteAt: number
  cooldownRemaining: number
  blockTimestamp: number
}

export type ResolveCooldownInput = {
  voterState?: VoterStateCooldownInput | null
  minIntervalSeconds: number
  backendRemainingSeconds?: number | null
  nowWallMs?: number
}

const STORAGE_PREFIX = 'votar:cooldown-anchor:v1'

/** VOTAR-452 — localStorage survives tab close; sessionStorage does not. */
export const COOLDOWN_ANCHOR_STORAGE: Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
> =
  typeof localStorage !== 'undefined'
    ? localStorage
    : typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        }

export const cooldownStorageKey = (idEleccion: number, scope: string): string =>
  `${STORAGE_PREFIX}:${idEleccion}:${scope}`

export const computeRemainingSeconds = (
  anchor: CooldownAnchor,
  nowWallMs: number = Date.now()
): number => {
  const elapsedWallSeconds = (nowWallMs - anchor.observedAtWallMs) / 1000
  const estimatedNodeNow = anchor.observedBlockTimestamp + elapsedWallSeconds
  const remaining = anchor.unlockAtNodeSeconds - estimatedNodeNow
  return remaining > 0 ? Math.ceil(remaining) : 0
}

export const buildAnchorFromOnChain = (
  state: VoterStateCooldownInput,
  minIntervalSeconds: number,
  nowWallMs: number = Date.now()
): CooldownAnchor | null => {
  if (state.lastVoteAt > 0 && minIntervalSeconds > 0) {
    const unlockAtNodeSeconds = state.lastVoteAt + minIntervalSeconds
    if (unlockAtNodeSeconds <= state.blockTimestamp) {
      return null
    }
    return {
      unlockAtNodeSeconds,
      observedBlockTimestamp: state.blockTimestamp,
      observedAtWallMs: nowWallMs,
      lastVoteAt: state.lastVoteAt,
    }
  }

  if (state.cooldownRemaining <= 0) {
    return null
  }

  return {
    unlockAtNodeSeconds: state.blockTimestamp + state.cooldownRemaining,
    observedBlockTimestamp: state.blockTimestamp,
    observedAtWallMs: nowWallMs,
    lastVoteAt: state.lastVoteAt,
  }
}

export const buildAnchorFromBackend = (
  remainingSeconds: number,
  nowWallMs: number = Date.now()
): CooldownAnchor | null => {
  if (remainingSeconds <= 0) {
    return null
  }
  const observedBlockTimestamp = Math.floor(nowWallMs / 1000)
  return {
    unlockAtNodeSeconds: observedBlockTimestamp + remainingSeconds,
    observedBlockTimestamp,
    observedAtWallMs: nowWallMs,
    lastVoteAt: 0,
  }
}

/**
 * Fusiona anclas sin alargar el countdown cuando el nodo no avanzó.
 * Un `lastVoteAt` on-chain nuevo sí reemplaza el ancla (voto fresco).
 */
export const mergeCooldownAnchor = (
  previous: CooldownAnchor | null,
  next: CooldownAnchor | null,
  nowWallMs: number = Date.now()
): CooldownAnchor | null => {
  if (!next) {
    return null
  }
  if (!previous) {
    return next
  }

  if (
    next.lastVoteAt > 0 &&
    previous.lastVoteAt > 0 &&
    next.lastVoteAt !== previous.lastVoteAt
  ) {
    return next
  }

  const prevRemaining = computeRemainingSeconds(previous, nowWallMs)
  const nextRemaining = computeRemainingSeconds(next, nowWallMs)

  // El ticker local llegó a 0 pero la autoridad (backend/nodo) aún reporta
  // espera — adoptar el ancla fresca (VOTAR-449, reloj de bloque atrasado).
  if (prevRemaining <= 0 && nextRemaining > 0) {
    return next
  }

  // Primera lectura on-chain tras advisory backend: adoptar unlock absoluto
  // del nodo, pero sin estirar el remaining ya mostrado si el bloque está
  // congelado (VOTAR-449 bugs 1–2).
  if (previous.lastVoteAt === 0 && next.lastVoteAt > 0) {
    if (nextRemaining > prevRemaining) {
      return {
        unlockAtNodeSeconds: previous.observedBlockTimestamp + prevRemaining,
        observedBlockTimestamp: previous.observedBlockTimestamp,
        observedAtWallMs: previous.observedAtWallMs,
        lastVoteAt: next.lastVoteAt,
      }
    }
    return next
  }

  if (next.observedBlockTimestamp > previous.observedBlockTimestamp) {
    return {
      unlockAtNodeSeconds: next.unlockAtNodeSeconds,
      observedBlockTimestamp: next.observedBlockTimestamp,
      observedAtWallMs: next.observedAtWallMs,
      lastVoteAt: next.lastVoteAt || previous.lastVoteAt,
    }
  }

  // Mismo (o más viejo) block.timestamp: seguir extrapolando desde la
  // observación previa para que el ticker no vuelva a 20s.
  return {
    unlockAtNodeSeconds: Math.min(
      previous.unlockAtNodeSeconds,
      next.unlockAtNodeSeconds
    ),
    observedBlockTimestamp: previous.observedBlockTimestamp,
    observedAtWallMs: previous.observedAtWallMs,
    lastVoteAt: next.lastVoteAt || previous.lastVoteAt,
  }
}

export const resolveCooldownAnchor = (
  input: ResolveCooldownInput
): CooldownAnchor | null => {
  const nowWallMs = input.nowWallMs ?? Date.now()
  const onChain = input.voterState
    ? buildAnchorFromOnChain(
        input.voterState,
        input.minIntervalSeconds,
        nowWallMs
      )
    : null
  const backend =
    input.backendRemainingSeconds !== undefined &&
    input.backendRemainingSeconds !== null
      ? buildAnchorFromBackend(input.backendRemainingSeconds, nowWallMs)
      : null

  if (onChain) {
    return mergeCooldownAnchor(backend, onChain, nowWallMs)
  }
  return backend
}

export const loadPersistedCooldownAnchor = (
  idEleccion: number,
  scope: string,
  storage: Pick<Storage, 'getItem'> = COOLDOWN_ANCHOR_STORAGE
): CooldownAnchor | null => {
  try {
    const raw = storage.getItem(cooldownStorageKey(idEleccion, scope))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<CooldownAnchor>
    if (
      typeof parsed.unlockAtNodeSeconds !== 'number' ||
      typeof parsed.observedBlockTimestamp !== 'number' ||
      typeof parsed.observedAtWallMs !== 'number' ||
      typeof parsed.lastVoteAt !== 'number'
    ) {
      return null
    }
    return {
      unlockAtNodeSeconds: parsed.unlockAtNodeSeconds,
      observedBlockTimestamp: parsed.observedBlockTimestamp,
      observedAtWallMs: parsed.observedAtWallMs,
      lastVoteAt: parsed.lastVoteAt,
    }
  } catch {
    return null
  }
}

export const persistCooldownAnchor = (
  idEleccion: number,
  scope: string,
  anchor: CooldownAnchor | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = COOLDOWN_ANCHOR_STORAGE
): void => {
  const key = cooldownStorageKey(idEleccion, scope)
  if (!anchor) {
    storage.removeItem(key)
    return
  }
  storage.setItem(key, JSON.stringify(anchor))
}
