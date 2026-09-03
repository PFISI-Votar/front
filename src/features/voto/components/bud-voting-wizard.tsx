import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  CircleOff,
  Clock3,
  Download,
  ExternalLink,
  Fingerprint,
  Loader2,
  LogOut,
  PenLine,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Hex } from 'viem'
import budFingerprint from '@/assets/bud-fingerprint.png'
import { resolveMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TIPOS_VOTACION,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'
import { firmarRecibo } from '@/features/voto/api/recibo-api'
import {
  obtenerEstadoRevoto,
  registrarTransaccionPublica,
  registrarVotoEmitidoAnonimo,
} from '@/features/voto/api/voto-api'
import {
  BUD_CANDIDATE_GRID_CLASS,
  BUD_LIST_GRID_CLASS,
  BUD_SHELL_SECTION_CLASS,
  BUD_STICKY_CTA_CLASS,
} from '@/features/voto/components/bud-layout.constants'
import { VoteTransmitErrorAlert } from '@/features/voto/components/vote-transmit-error-alert'
import type { SignedVotePayload } from '@/features/voto/crypto'
import { getExplorerTxUrl } from '@/features/voto/crypto/constants'
import {
  computeRemainingSeconds,
  loadPersistedCooldownAnchor,
  mergeCooldownAnchor,
  persistCooldownAnchor,
  resolveCooldownAnchor,
  type CooldownAnchor,
} from '@/features/voto/crypto/cooldown-clock'
import { logVoteTxError } from '@/features/voto/crypto/log-vote-tx-error'
import {
  calcularNullifier,
  CredencialNulificadorInvalidaError,
} from '@/features/voto/crypto/nullifier'
import {
  clearPendingVoteCast,
  loadPendingVoteCast,
  savePendingVoteCast,
} from '@/features/voto/crypto/pending-vote-cast'
import { useEphemeralWallet } from '@/features/voto/crypto/use-ephemeral-wallet'
import {
  transmitSignedVote,
  waitForVoteTxReceipt,
  type TransmitProgressPhase,
} from '@/features/voto/crypto/vote-transmitter'
import {
  formatCooldownDuration,
  getMessageForRevert,
} from '@/features/voto/crypto/vote-tx-error-catalog'
import {
  mapVoteTxError,
  type VoteTxError,
} from '@/features/voto/crypto/vote-tx-errors'
import {
  leerHasVoted,
  leerIsNullifierUsed,
} from '@/features/voto/crypto/voter-state'
import type {
  BoletaDigital,
  CandidatoBoletaDigital,
  EstadoRevoto,
  VoterMerkleProof,
} from '@/features/voto/data/schema'
import {
  estadoRevotoQueryKey,
  useEstadoRevoto,
  useRegistrarConsumoIntento,
} from '@/features/voto/hooks/use-estado-revoto'
import { useSolicitarMerkleProof } from '@/features/voto/hooks/use-merkle-proof'
import {
  useVoterStateOnChain,
  voterStateOnChainQueryKey,
} from '@/features/voto/hooks/use-voter-state-onchain'
import { generarReciboPDF } from '@/features/voto/lib/generar-recibo-pdf'
import { clearVotanteSession } from '@/features/voto/services/votante-session'
import {
  areAllRolesBlank,
  BLANK_SELECTION_ID,
  buildWizardSelectionPayload,
  isBlankSelection,
  roleHasBlankSelection,
} from '@/features/voto/utils/wizard-selection'

type VotingVariant = 'lista-completa' | 'candidatos'
type SpecialVote = 'blank' | 'null' | null
type WizardStep =
  | 'identity'
  | 'registered'
  | 'selection'
  | 'review'
  | 'transmitting'
  | 'success'
  | 'limit-reached'
  | 'cooldown'

type TransmitUiPhase = TransmitProgressPhase | 'reconciling' | 'error'

type Candidate = {
  id: string
  roleId: string
  role: string
  name: string
  listId: string
  listName: string
  numeroLista: number
  listInitials: string
  listImageUrl?: string | null
  initials: string
  color: string
  imageUrl?: string | null
}

type CandidateRole = {
  id: string
  name: string
  /** Max candidates the voter may select in this role (from cantidadCargos). */
  maxSelecciones: number
}

type PartyList = {
  id: string
  name: string
  color: string
  accent: string
  initials: string
  imageUrl?: string | null
}

type BudVotingWizardProps = {
  boleta: BoletaDigital
  tipoVotacion: TipoVotacion
  /** JWT sub — scopes revote cache, cooldown anchor and ephemeral wallet per voter (VOTAR-452). */
  votanteScope: string
  cryptoReady?: boolean
  /** VOTAR-347 — true mientras la urna digital está pausada por incidente. */
  pausada?: boolean
  onLogout: () => void
}

const BACKGROUND_FINGERPRINTS = [
  { top: '7%', left: '13%', width: '7rem', opacity: 0.04, rotate: '-18deg' },
  { top: '18%', left: '88%', width: '8rem', opacity: 0.035, rotate: '19deg' },
  { top: '46%', left: '8%', width: '8rem', opacity: 0.035, rotate: '25deg' },
  { top: '62%', left: '92%', width: '7.5rem', opacity: 0.04, rotate: '-12deg' },
  {
    top: '88%',
    left: '28%',
    width: '8.5rem',
    opacity: 0.035,
    rotate: '-24deg',
  },
  { top: '86%', left: '76%', width: '7rem', opacity: 0.032, rotate: '16deg' },
] as const

const getInitials = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[words.length - 1]?.[0] ?? ''}`.toUpperCase()
}

const getSoftAccent = (color: string) => `${color}22`

const getListImageUrl = (candidate: CandidatoBoletaDigital) =>
  candidate.imagenListaUrl ??
  candidate.logoListaUrl ??
  candidate.fotoListaUrl ??
  null

const getVotingVariant = (tipoVotacion: TipoVotacion): VotingVariant => {
  if (tipoVotacion === TIPOS_VOTACION.POR_CANDIDATO) return 'candidatos'
  return 'lista-completa'
}

const buildListsFromBoleta = (boleta: BoletaDigital): PartyList[] => {
  const lists = new Map<string, PartyList>()

  boleta.categorias.forEach((categoria) => {
    categoria.candidatos.forEach((candidate) => {
      const id = String(candidate.idLista)
      const color = candidate.colorLista || '#2f6f9f'

      if (!lists.has(id)) {
        lists.set(id, {
          id,
          name: candidate.agrupacionPolitica,
          color,
          accent: getSoftAccent(color),
          initials: getInitials(candidate.agrupacionPolitica),
          imageUrl: getListImageUrl(candidate),
        })
      }
    })
  })

  return Array.from(lists.values()).sort((a, b) => a.name.localeCompare(b.name))
}

const buildRolesFromBoleta = (boleta: BoletaDigital): CandidateRole[] =>
  boleta.categorias
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((categoria) => ({
      id: String(categoria.idCategoria),
      name: categoria.nombre,
      maxSelecciones: Math.max(1, categoria.cantidadCargos ?? 1),
    }))

/**
 * Toggle / replace selection for a role respecting maxSelecciones (VOTAR-474).
 * Blank is cleared when picking a candidate. At capacity, further adds are ignored
 * (deselect still works).
 */
const applyCandidateSelection = (
  current: Record<string, string[]>,
  role: CandidateRole,
  candidateId: string
): Record<string, string[]> => {
  const existing = (current[role.id] ?? []).filter(
    (id) => !isBlankSelection(id)
  )

  if (role.maxSelecciones <= 1) {
    return { ...current, [role.id]: [candidateId] }
  }

  if (existing.includes(candidateId)) {
    return {
      ...current,
      [role.id]: existing.filter((id) => id !== candidateId),
    }
  }

  if (existing.length >= role.maxSelecciones) {
    return current
  }

  return { ...current, [role.id]: [...existing, candidateId] }
}

const mapCandidate = (
  candidate: CandidatoBoletaDigital,
  roleName: string
): Candidate => ({
  id: String(candidate.idCandidato),
  roleId: String(candidate.idCategoria),
  role: roleName,
  name: candidate.nombreCompleto,
  listId: String(candidate.idLista),
  listName: candidate.agrupacionPolitica,
  numeroLista: candidate.numeroLista,
  listInitials: getInitials(candidate.agrupacionPolitica),
  listImageUrl: getListImageUrl(candidate),
  initials: getInitials(candidate.nombreCompleto),
  color: candidate.colorLista || '#2f6f9f',
  imageUrl: candidate.fotoUrl,
})

const buildCandidatesFromBoleta = (boleta: BoletaDigital): Candidate[] =>
  boleta.categorias.flatMap((categoria) =>
    categoria.candidatos.map((candidate) =>
      mapCandidate(candidate, categoria.nombre)
    )
  )

/**
 * VOTAR-464: si la lista elegida no postuló candidato para un rol, ese rol se
 * marca en blanco en vez de quedar sin selección — así el paso de revisión
 * (que sólo sabe leer "candidato" o "blanco") lo muestra explícitamente en
 * vez de omitirlo en silencio de la boleta.
 *
 * VOTAR-474: en categorías multi-banca toma hasta `maxSelecciones` postulantes
 * de esa lista (no solo el primero).
 */
const getCandidateSelectionsForList = (
  listId: string,
  roles: CandidateRole[],
  candidates: Candidate[]
) =>
  roles.reduce<Record<string, string[]>>((selections, role) => {
    const roleCandidates = candidates.filter(
      (item) => item.listId === listId && item.roleId === role.id
    )

    selections[role.id] =
      roleCandidates.length > 0
        ? roleCandidates
            .slice(0, role.maxSelecciones)
            .map((candidate) => candidate.id)
        : [BLANK_SELECTION_ID]

    return selections
  }, {})

const groupCandidatesByParty = (candidates: Candidate[]) => {
  const groups = new Map<
    string,
    {
      id: string
      name: string
      color: string
      initials: string
      imageUrl?: string | null
      candidates: Candidate[]
    }
  >()

  candidates.forEach((candidate) => {
    if (!groups.has(candidate.listId)) {
      groups.set(candidate.listId, {
        id: candidate.listId,
        name: candidate.listName,
        color: candidate.color,
        initials: candidate.listInitials,
        imageUrl: candidate.listImageUrl,
        candidates: [],
      })
    }

    groups.get(candidate.listId)?.candidates.push(candidate)
  })

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

const showVoteErrorToast = (error: VoteTxError): void => {
  if (error.severity === 'warning') {
    toast.warning(error.message, { duration: 8000 })
    return
  }
  toast.error(error.message, { duration: 8000 })
}

const reportVoteTxError = (error: VoteTxError, electionId: number): void => {
  logVoteTxError({
    electionId,
    revertName: error.revertName,
    code: error.code,
  })
  showVoteErrorToast(error)
}

export const BudVotingWizard = ({
  boleta,
  tipoVotacion,
  votanteScope,
  cryptoReady = false,
  pausada = false,
  onLogout,
}: BudVotingWizardProps) => {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<WizardStep>('identity')
  const variant = getVotingVariant(tipoVotacion)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [specialVote, setSpecialVote] = useState<SpecialVote>(null)
  const [candidateSelections, setCandidateSelections] = useState<
    Record<string, string[]>
  >({})
  const [merkleProofData, setMerkleProofData] =
    useState<VoterMerkleProof | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [signingError, setSigningError] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [signedVote, setSignedVote] = useState<SignedVotePayload | null>(null)
  const [transmitPhase, setTransmitPhase] = useState<TransmitUiPhase | null>(
    null
  )
  const [txHash, setTxHash] = useState<Hex | null>(null)
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [txError, setTxError] = useState<VoteTxError | null>(null)
  /** True once a vote was registered; survives clearing merkle/signed state (VOTAR-379). */
  const [voteReceiptReady, setVoteReceiptReady] = useState(false)
  const [cooldownAnchor, setCooldownAnchor] = useState<CooldownAnchor | null>(
    null
  )
  const [cooldownNowMs, setCooldownNowMs] = useState(() => Date.now())
  const merkleProofMutation = useSolicitarMerkleProof(boleta.idEleccion)
  const {
    data: estadoRevoto,
    isLoading: isLoadingEstadoRevoto,
    isError: isEstadoRevotoError,
  } = useEstadoRevoto(boleta.idEleccion, votanteScope)
  const registrarConsumoMutation = useRegistrarConsumoIntento(
    boleta.idEleccion,
    votanteScope
  )
  const {
    signVotePayload,
    initialize: initializeEphemeralWallet,
    destroy: destroyEphemeralWallet,
    publicKeyHex,
  } = useEphemeralWallet()

  // VOTAR-325: nullifier derivado apenas la billetera efímera está lista, para
  // poder consultar getVoterState() on-chain desde el arranque del wizard
  // (no solo al firmar). Determinístico por votante+elección (VOTAR-353).
  const nullifier = useMemo(() => {
    if (!publicKeyHex) {
      return null
    }
    try {
      return calcularNullifier(publicKeyHex, boleta.idEleccion)
    } catch {
      return null
    }
  }, [publicKeyHex, boleta.idEleccion])

  const cooldownScope = nullifier ?? `pre-nullifier:${votanteScope}`

  const { data: voterStateOnChain } = useVoterStateOnChain(
    boleta.idEleccion,
    nullifier,
    boleta.ballotContractAddress
  )

  // VOTAR-449: ancla estable (extrapolación + sessionStorage) para no reiniciar
  // el countdown cuando block.timestamp está congelado o al hidratar on-chain.
  // Sincroniza estado React con sistemas externos (RPC / API / sessionStorage).
  useEffect(() => {
    const persisted = loadPersistedCooldownAnchor(
      boleta.idEleccion,
      cooldownScope
    )
    const resolved = resolveCooldownAnchor({
      voterState: voterStateOnChain,
      minIntervalSeconds: estadoRevoto?.minIntervaloSegundos ?? 0,
      backendRemainingSeconds: estadoRevoto?.proximoReintentoEnSegundos,
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- VOTAR-449: merge de ancla con getVoterState/estado-revoto/sessionStorage
    setCooldownAnchor((previous) => {
      const merged = mergeCooldownAnchor(
        mergeCooldownAnchor(persisted, previous),
        resolved
      )
      if (
        previous &&
        merged &&
        previous.unlockAtNodeSeconds === merged.unlockAtNodeSeconds &&
        previous.observedBlockTimestamp === merged.observedBlockTimestamp &&
        previous.observedAtWallMs === merged.observedAtWallMs &&
        previous.lastVoteAt === merged.lastVoteAt
      ) {
        return previous
      }
      if (previous === null && merged === null) {
        return previous
      }
      persistCooldownAnchor(boleta.idEleccion, cooldownScope, merged)
      return merged
    })
  }, [
    boleta.idEleccion,
    cooldownScope,
    estadoRevoto?.minIntervaloSegundos,
    estadoRevoto?.proximoReintentoEnSegundos,
    voterStateOnChain,
  ])

  useEffect(() => {
    if (!cooldownAnchor) {
      return
    }
    const intervalId = window.setInterval(
      () => setCooldownNowMs(Date.now()),
      1_000
    )
    return () => window.clearInterval(intervalId)
  }, [cooldownAnchor])

  const intentosAgotados =
    Boolean(estadoRevoto) && (estadoRevoto?.intentosRestantes ?? 1) === 0
  const cooldownRemainingSeconds = cooldownAnchor
    ? computeRemainingSeconds(cooldownAnchor, cooldownNowMs)
    : 0
  const cooldownActivo = cooldownRemainingSeconds > 0
  const pendingResumeStartedRef = useRef(false)
  const consumoCatchUpStartedRef = useRef(false)
  // Derive UI step when attempts are exhausted or cooldown is active.
  const effectiveStep: WizardStep =
    intentosAgotados && step !== 'success' && step !== 'transmitting'
      ? 'limit-reached'
      : cooldownActivo && step !== 'success' && step !== 'transmitting'
        ? 'cooldown'
        : step

  const finalizeSuccessfulCast = async (receipt: {
    txHash: Hex | null
    blockNumber: number | null
    /** On-chain votesUsed for this nullifier; drives idempotent backend sync. */
    votosObjetivo?: number
  }) => {
    // VOTAR-451 / VOTAR-452: claim the consumo lock before background sync so catch-up cannot race.
    consumoCatchUpStartedRef.current = true
    setTxHash(receipt.txHash)
    setBlockNumber(receipt.blockNumber)
    setTransmitPhase(null)
    setTxError(null)
    const votosObjetivo =
      receipt.votosObjetivo ?? Math.max(1, voterStateOnChain?.votesUsed ?? 1)

    // On-chain cast is authoritative — show receipt immediately (VOTAR-451 UAT).
    setSignedVote(null)
    setMerkleProofData(null)
    setVoteReceiptReady(true)
    setStep('success')
    clearPendingVoteCast(boleta.idEleccion)

    // VOTAR-328 / VOTAR-445 / VOTAR-451 / VOTAR-452: sync consumo without blocking success UX.
    void registrarConsumoMutation.mutateAsync(votosObjetivo).catch(() => {
      consumoCatchUpStartedRef.current = false
    })
    if (receipt.txHash) {
      void registrarTransaccionPublica(boleta.idEleccion, receipt.txHash).catch(
        () => {
          // Recibo on-chain ya confirmado; el índice no debe bloquear la UX.
        }
      )
    }
    void registrarVotoEmitidoAnonimo(boleta.idEleccion).catch(() => {
      // Recibo on-chain ya confirmado; el audit no debe bloquear la UX.
    })
    void clearVotanteSession()
  }

  // VOTAR-445: si F5 interrumpió el wait del receipt, reanudar y completar consumo.
  useEffect(() => {
    if (pendingResumeStartedRef.current) {
      return
    }
    const pending = loadPendingVoteCast(boleta.idEleccion)
    if (!pending) {
      return
    }
    pendingResumeStartedRef.current = true
    consumoCatchUpStartedRef.current = true

    const resumePendingCast = async () => {
      setStep('transmitting')
      setTransmitPhase('confirming')
      setTxHash(pending.txHash)
      try {
        const result = await waitForVoteTxReceipt(pending.txHash)
        await finalizeSuccessfulCast({
          txHash: result.txHash,
          blockNumber: Number(result.blockNumber),
        })
      } catch (error) {
        const mapped = mapVoteTxError(error)
        if (mapped.code === 'already_registered') {
          await finalizeSuccessfulCast({
            txHash: pending.txHash,
            blockNumber: null,
          })
          return
        }
        if (mapped.code === 'timeout' || mapped.code === 'network') {
          clearPendingVoteCast(boleta.idEleccion)
        }
        reportVoteTxError(mapped, boleta.idEleccion)
        setTxError(mapped)
        setTransmitPhase('error')
      }
    }

    void resumePendingCast()
    // Solo al montar / cambiar de comicio: el pending vive fuera de React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boleta.idEleccion])

  // VOTAR-445 / VOTAR-451: si on-chain ya contabilizó votos y el backend no, sync idempotente.
  useEffect(() => {
    if (consumoCatchUpStartedRef.current) {
      return
    }
    if (!voterStateOnChain || !estadoRevoto) {
      return
    }
    if (voterStateOnChain.votesUsed <= estadoRevoto.votosConsumidos) {
      return
    }
    if (step === 'success' || step === 'transmitting') {
      return
    }
    consumoCatchUpStartedRef.current = true
    void registrarConsumoMutation
      .mutateAsync(voterStateOnChain.votesUsed)
      .catch(() => {
        consumoCatchUpStartedRef.current = false
      })
  }, [estadoRevoto, registrarConsumoMutation, step, voterStateOnChain])

  const lists = useMemo(() => buildListsFromBoleta(boleta), [boleta])
  const roles = useMemo(() => buildRolesFromBoleta(boleta), [boleta])
  const candidates = useMemo(() => buildCandidatesFromBoleta(boleta), [boleta])
  const selectedList = lists.find((list) => list.id === selectedListId)
  const selectedCandidates = useMemo(
    () =>
      roles.flatMap((role) =>
        (candidateSelections[role.id] ?? [])
          .filter((candidateId) => !isBlankSelection(candidateId))
          .map((candidateId) =>
            candidates.find((candidate) => candidate.id === candidateId)
          )
          .filter((candidate): candidate is Candidate => Boolean(candidate))
      ),
    [candidateSelections, candidates, roles]
  )
  const rolesWithCandidates = roles.filter((role) =>
    candidates.some((candidate) => candidate.roleId === role.id)
  )
  const roleSelectionComplete = (roleId: string) =>
    (candidateSelections[roleId] ?? []).length > 0
  const allRolesSelected = rolesWithCandidates.every((role) =>
    roleSelectionComplete(role.id)
  )
  const wholeBallotBlank =
    specialVote === 'blank' ||
    areAllRolesBlank(candidateSelections, roles, candidates)
  const canContinueSelection =
    Boolean(specialVote) ||
    (variant === 'lista-completa' && Boolean(selectedList)) ||
    (variant === 'candidatos' && (Boolean(selectedList) || allRolesSelected))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const goToSelection = () => {
    setStep('selection')
  }

  const resetVote = () => {
    setSelectedListId(null)
    setSpecialVote(null)
    setCandidateSelections({})
    setSignedVote(null)
    setSigningError(null)
    setTransmitPhase(null)
    setTxHash(null)
    setBlockNumber(null)
    setTxError(null)
    setVoteReceiptReady(false)
  }

  const handleModifyVote = async () => {
    setSigningError(null)
    try {
      // VOTAR-418: post-sign destroy() cleared the key; mint a fresh wallet to re-sign.
      await initializeEphemeralWallet(boleta.idEleccion, votanteScope)
      resetVote()
      goToSelection()
    } catch {
      setSigningError(
        'No pudimos regenerar tu identidad criptográfica. Reintentá o cerrá sesión.'
      )
    }
  }

  const handleSelectList = (listId: string | null) => {
    setSpecialVote(null)
    setSelectedListId(listId)

    if (variant === 'candidatos') {
      setCandidateSelections(
        listId ? getCandidateSelectionsForList(listId, roles, candidates) : {}
      )
    }

    // Elegir una lista completa (por lista o como atajo "por cargo") ya deja
    // la boleta lista — avanza directo a revisión en vez de esperar un
    // "Continuar" aparte. Deseleccionar (listId null) no avanza.
    if (listId) {
      setStep('review')
    }
  }

  const transmitVote = async (signed: SignedVotePayload) => {
    // VOTAR-347 — corta antes de gastar gas en una tx que el contrato va a
    // revertir igual (EnforcedPause): mismo código/mensaje que un revert real,
    // pero instantáneo y sin round-trip a la red.
    if (pausada) {
      const mapped = getMessageForRevert('EnforcedPause')
      if (mapped) {
        const pausedError: VoteTxError = {
          code: mapped.code,
          message: mapped.message,
          severity: mapped.severity,
          isTransient: mapped.isTransient,
          canRetrySend: mapped.canRetrySend,
          canResign: mapped.canResign,
          revertName: 'EnforcedPause',
        }
        reportVoteTxError(pausedError, boleta.idEleccion)
        setTxError(pausedError)
        setTransmitPhase('error')
        setStep('transmitting')
        return
      }
    }

    if (!merkleProofData?.hashHoja) {
      const missingProofError = mapVoteTxError(
        new Error('Merkle proof or hashHoja is missing')
      )
      setTxError({
        ...missingProofError,
        message:
          'Falta la prueba de padrón. Volvé a confirmar tu identidad e intentá de nuevo.',
        canRetrySend: false,
        canResign: true,
      })
      setTransmitPhase('error')
      setStep('transmitting')
      return
    }

    setTxError(null)
    setTxHash(null)
    setBlockNumber(null)
    setStep('transmitting')
    setTransmitPhase('estimating')

    try {
      // VOTAR-451: leaf already voted under another nullifier (tab reopen) →
      // do not broadcast a second unique VoteCast.
      const leaf = merkleProofData.hashHoja as Hex
      const ballotAddress = merkleProofData.ballotContractAddress
      setTransmitPhase('reconciling')
      const leafAlreadyVoted = await leerHasVoted(
        boleta.idEleccion,
        leaf,
        ballotAddress
      )
      if (leafAlreadyVoted) {
        const nullifierAlreadyUsed = nullifier
          ? await leerIsNullifierUsed(
              boleta.idEleccion,
              nullifier,
              ballotAddress
            )
          : false
        if (!nullifierAlreadyUsed) {
          await finalizeSuccessfulCast({
            txHash: loadPendingVoteCast(boleta.idEleccion)?.txHash ?? null,
            blockNumber: null,
            votosObjetivo: Math.max(
              1,
              voterStateOnChain?.votesUsed ?? estadoRevoto?.votosConsumidos ?? 1
            ),
          })
          return
        }
      }

      setTransmitPhase('estimating')
      const result = await transmitSignedVote(
        {
          signed,
          voterLeaf: leaf,
          merkleProof: merkleProofData.merkleProof as Hex[],
        },
        {
          contractAddress: ballotAddress,
          onProgress: (phase) => {
            setTransmitPhase(phase)
          },
          onTxHash: (hash) => {
            // Persist before waiting for receipt so F5 can resume (VOTAR-445).
            savePendingVoteCast(boleta.idEleccion, hash)
            setTxHash(hash)
          },
        }
      )
      await finalizeSuccessfulCast({
        txHash: result.txHash,
        blockNumber: Number(result.blockNumber),
        votosObjetivo: Math.max(1, (voterStateOnChain?.votesUsed ?? 0) + 1),
      })
    } catch (error) {
      const mapped = mapVoteTxError(error)
      // VOTAR-449: el nodo aún exige espera — volver al panel de cooldown en
      // vez de dejar al votante atrapado en un error sin reintento (bug 3).
      if (mapped.code === 'retry_too_soon') {
        reportVoteTxError(mapped, boleta.idEleccion)
        setTxError(null)
        setTransmitPhase(null)
        setStep('selection')
        void queryClient.invalidateQueries({
          queryKey: estadoRevotoQueryKey(boleta.idEleccion, votanteScope),
        })
        void queryClient.invalidateQueries({
          queryKey: voterStateOnChainQueryKey(
            boleta.idEleccion,
            nullifier,
            boleta.ballotContractAddress
          ),
        })
        return
      }
      // VOTAR-445: el cast ya quedó on-chain (p. ej. tras F5); reconciliar UX + consumo.
      if (mapped.code === 'already_registered') {
        const pending = loadPendingVoteCast(boleta.idEleccion)
        await finalizeSuccessfulCast({
          txHash: pending?.txHash ?? null,
          blockNumber: null,
        })
        return
      }
      reportVoteTxError(mapped, boleta.idEleccion)
      setTxError(mapped)
      setTransmitPhase('error')
    }
  }

  const handleIdentityConfirm = async () => {
    setIdentityError(null)
    try {
      if (intentosAgotados) {
        setStep('limit-reached')
        return
      }
      const proof = await merkleProofMutation.mutateAsync()
      setMerkleProofData(proof)
      const returning =
        (estadoRevoto?.votosConsumidos ?? 0) > 0 &&
        (estadoRevoto?.puedeVotar ?? true)
      setStep(returning ? 'registered' : 'selection')
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          onLogout()
          return
        }
        if (error.response?.status === 403) {
          setIdentityError('No te encuentras habilitado en el padrón.')
          return
        }
        if (error.response?.status === 429) {
          setIdentityError(
            'Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.'
          )
          return
        }
      }
      setIdentityError(
        'No pudimos obtener tu prueba de pertenencia al padrón. Reintentá.'
      )
    }
  }

  const handleSignVote = async () => {
    setSigningError(null)

    if (!boleta.ballotContractAddress) {
      setSigningError(
        'No se pudo resolver el contrato de la elección. Recargá la página e intentá de nuevo.'
      )
      return
    }

    setIsSigning(true)

    try {
      // After a successful sign the ephemeral key is zeroized (VOTAR-357).
      // Re-initialize so retries / second attempts always have signing material.
      const session = await initializeEphemeralWallet(
        boleta.idEleccion,
        votanteScope
      )
      const signingPublicKey = session.publicKeyHex

      let nullifier: `0x${string}`
      try {
        nullifier = calcularNullifier(signingPublicKey, boleta.idEleccion)
      } catch (error) {
        if (error instanceof CredencialNulificadorInvalidaError) {
          setSigningError(
            'No se pudo calcular tu identificador anónimo de votación. Reintentá.'
          )
          setIsSigning(false)
          return
        }
        throw error
      }

      const selection = buildWizardSelectionPayload({
        specialVote,
        candidateSelections,
        selectedListId,
        roles,
        candidates,
      })
      const signed = await signVotePayload(
        selection,
        nullifier,
        boleta.ballotContractAddress
      )
      setSignedVote(signed)
      setIsSigning(false)
      await transmitVote(signed)
    } catch {
      setSigningError(
        'No pudimos firmar tu voto de forma local. Reintentá en unos segundos.'
      )
      setIsSigning(false)
    }
  }

  const handleRetryTransmit = async () => {
    if (!signedVote) {
      return
    }
    await transmitVote(signedVote)
  }

  const handleResignVote = async () => {
    setTxError(null)
    setTransmitPhase(null)
    setTxHash(null)
    setBlockNumber(null)
    setSignedVote(null)
    setSigningError(null)
    try {
      await initializeEphemeralWallet(boleta.idEleccion, votanteScope)
      setStep('review')
    } catch {
      setSigningError(
        'No pudimos renovar tu identidad criptográfica. Reintentá iniciar sesión.'
      )
      setStep('review')
    }
  }

  const handleLogout = () => {
    destroyEphemeralWallet()
    onLogout()
  }

  const handleSpecialVote = (value: Exclude<SpecialVote, null>) => {
    setSelectedListId(null)
    setCandidateSelections({})
    setSpecialVote((current) => (current === value ? null : value))
  }

  // Esperar a conocer el estado de revoto antes de decidir el paso inicial.
  // Evita mostrar brevemente la pantalla de identidad cuando el usuario
  // en realidad debe ir a cooldown o límite de intentos.
  if (isLoadingEstadoRevoto) {
    return (
      <BudWizardShell
        step='identity'
        estadoRevoto={estadoRevoto}
        onLogout={handleLogout}
      >
        <div className='flex min-h-[24rem] items-center justify-center'>
          <p className='text-sm text-slate-600'>Preparando tu boleta…</p>
        </div>
      </BudWizardShell>
    )
  }

  return (
    <BudWizardShell
      step={effectiveStep}
      estadoRevoto={estadoRevoto}
      onLogout={handleLogout}
    >
      {pausada && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='size-4' aria-hidden='true' />
          <AlertTitle>Sistema en pausa</AlertTitle>
          <AlertDescription>
            La autoridad electoral pausó temporalmente la urna digital por
            medidas de seguridad. Podés seguir revisando la boleta, pero el
            envío de votos está deshabilitado hasta que se reanude el comicio.
          </AlertDescription>
        </Alert>
      )}
      {effectiveStep !== 'limit-reached' && effectiveStep !== 'cooldown' ? (
        <WizardStepper currentStep={effectiveStep} />
      ) : null}
      <div
        key={effectiveStep}
        className='animate-in duration-300 fade-in-0 slide-in-from-bottom-3'
      >
        {effectiveStep === 'limit-reached' && (
          <MaxVotesReachedPanel
            maxVotos={estadoRevoto?.maxVotosPorVotante ?? 1}
            onLogout={handleLogout}
          />
        )}
        {effectiveStep === 'cooldown' && (
          <RetryTooSoonPanel
            remainingSeconds={cooldownRemainingSeconds}
            onCooldownFinished={async () => {
              // VOTAR-448: al llegar a 0, mismo comportamiento que cerrar sesión.
              // VOTAR-449: antes de logout, reconsultar por si el RPC aún reporta
              // cooldown (block.timestamp atrasado) y evitar un falso desbloqueo.
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: estadoRevotoQueryKey(
                    boleta.idEleccion,
                    votanteScope
                  ),
                }),
                queryClient.invalidateQueries({
                  queryKey: voterStateOnChainQueryKey(
                    boleta.idEleccion,
                    nullifier,
                    boleta.ballotContractAddress
                  ),
                }),
              ])
              const fresh = await obtenerEstadoRevoto(boleta.idEleccion)
              queryClient.setQueryData(
                estadoRevotoQueryKey(boleta.idEleccion, votanteScope),
                fresh
              )
              if ((fresh.proximoReintentoEnSegundos ?? 0) > 0) {
                return
              }
              persistCooldownAnchor(boleta.idEleccion, cooldownScope, null)
              handleLogout()
            }}
            onLogout={handleLogout}
          />
        )}
        {effectiveStep === 'identity' && (
          <IdentityStep
            boleta={boleta}
            identityError={identityError}
            cryptoReady={cryptoReady}
            isLoadingProof={
              merkleProofMutation.isPending || isLoadingEstadoRevoto
            }
            isEstadoRevotoError={isEstadoRevotoError}
            onConfirm={() => {
              void handleIdentityConfirm()
            }}
          />
        )}
        {effectiveStep === 'registered' && (
          <RegisteredVoteStep
            votosConsumidos={estadoRevoto?.votosConsumidos ?? 0}
            intentosRestantes={estadoRevoto?.intentosRestantes ?? 0}
            ultimoIntentoLabel={null}
            onLogout={handleLogout}
            onModify={() => {
              void handleModifyVote()
            }}
          />
        )}
        {effectiveStep === 'selection' && (
          <SelectionStep
            variant={variant}
            selectedListId={selectedListId}
            specialVote={specialVote}
            candidateSelections={candidateSelections}
            canContinue={canContinueSelection}
            permitirVotoNulo={boleta.permitirVotoNulo}
            lists={lists}
            roles={roles}
            candidates={candidates}
            onSpecialVote={handleSpecialVote}
            onSelectList={handleSelectList}
            onSelectCandidate={(roleId, candidateId) => {
              setSpecialVote(null)
              setCandidateSelections((current) => {
                const role = roles.find((item) => item.id === roleId)
                if (!role) {
                  return current
                }
                return applyCandidateSelection(current, role, candidateId)
              })
            }}
            onSelectBlank={(roleId) => {
              setSpecialVote(null)
              setSelectedListId(null)
              setCandidateSelections((current) => ({
                ...current,
                [roleId]: [BLANK_SELECTION_ID],
              }))
            }}
            onContinue={() => setStep('review')}
          />
        )}
        {effectiveStep === 'review' && (
          <ReviewStep
            variant={variant}
            selectedList={selectedList}
            selectedCandidates={selectedCandidates}
            candidateSelections={candidateSelections}
            specialVote={specialVote}
            wholeBallotBlank={wholeBallotBlank}
            roles={roles}
            candidates={candidates}
            signingError={signingError}
            isSigning={isSigning}
            pausada={pausada}
            onBack={goToSelection}
            onSign={() => {
              void handleSignVote()
            }}
          />
        )}
        {effectiveStep === 'transmitting' && (
          <TransmitStep
            phase={transmitPhase}
            txError={txError}
            specialVote={specialVote}
            wholeBallotBlank={wholeBallotBlank}
            candidateSelections={candidateSelections}
            selectedList={selectedList}
            selectedCandidates={selectedCandidates}
            roles={roles}
            onRetrySend={() => {
              void handleRetryTransmit()
            }}
            onResign={() => {
              void handleResignVote()
            }}
            onBackToSelection={() => {
              setTransmitPhase(null)
              setTxError(null)
              setSignedVote(null)
              goToSelection()
            }}
          />
        )}
        {effectiveStep === 'success' && (
          <SuccessStep
            voteReceiptReady={voteReceiptReady}
            txHash={txHash}
            blockNumber={blockNumber}
            idEleccion={boleta.idEleccion}
            nombreEleccion={boleta.nombreEleccion}
            signingError={signingError}
            onLogout={handleLogout}
            onModify={handleLogout}
          />
        )}
      </div>
    </BudWizardShell>
  )
}

const BudWizardShell = ({
  children,
  step,
  estadoRevoto,
  onLogout,
}: {
  children: ReactNode
  step: WizardStep
  estadoRevoto?: EstadoRevoto
  onLogout: () => void
}) => (
  <main className='votar-light-surface relative min-h-svh overflow-x-clip overflow-y-auto bg-[#fdfcfa] text-[#202124]'>
    <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
      {BACKGROUND_FINGERPRINTS.map((fingerprint) => (
        <img
          key={`${fingerprint.top}-${fingerprint.left}`}
          src={budFingerprint}
          alt=''
          className='absolute select-none'
          style={{
            top: fingerprint.top,
            left: fingerprint.left,
            width: fingerprint.width,
            opacity: fingerprint.opacity,
            transform: `translate(-50%, -50%) rotate(${fingerprint.rotate})`,
          }}
        />
      ))}
    </div>
    <section className={BUD_SHELL_SECTION_CLASS}>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f] sm:text-3xl'>
            VOTAR
          </p>
          <p className='mt-2 text-sm text-slate-600'>Boleta Única Digital</p>
        </div>
        <div className='flex max-w-full flex-wrap items-center gap-2'>
          {estadoRevoto ? (
            <Badge
              variant='outline'
              className='rounded-full border-emerald-300/70 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-900 sm:text-sm'
              aria-live='polite'
              data-testid='intentos-restantes'
            >
              Intentos restantes: {estadoRevoto.intentosRestantes}
            </Badge>
          ) : null}
          <Badge
            variant='outline'
            className='rounded-full border-[#2f6f9f]/30 bg-white/80 px-3 py-1 text-xs text-[#2f6f9f] sm:text-sm'
          >
            <ShieldCheck className='size-3.5' />
            {getStepLabel(step)}
          </Badge>
          {/* VOTAR-445: logout siempre visible; no toca contadores de revoto. */}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='rounded-full border-slate-300 bg-white/90'
            onClick={onLogout}
            aria-label='Cerrar sesión'
            data-testid='bud-logout'
          >
            <LogOut className='size-3.5' />
            Cerrar sesión
          </Button>
        </div>
      </header>
      {children}
    </section>
  </main>
)

const WizardStepper = ({ currentStep }: { currentStep: WizardStep }) => {
  const steps = [
    ['identity', 'Inicio'],
    ['selection', 'Voto'],
    ['review', 'Confirmación'],
    ['success', 'Éxito'],
  ] as const
  const normalizedStep =
    currentStep === 'registered'
      ? 'identity'
      : currentStep === 'transmitting'
        ? 'review'
        : currentStep
  const activeIndex = steps.findIndex(([step]) => step === normalizedStep)
  const currentStepInfo = steps[Math.max(activeIndex, 0)]

  return (
    <div className='rounded-2xl border border-[#dbe3ea] bg-white/90 shadow-sm backdrop-blur'>
      <details className='group sm:hidden'>
        <summary className='flex list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden'>
          <div className='flex items-center gap-3 text-[#2f6f9f]'>
            <span className='grid size-10 shrink-0 place-items-center rounded-full border border-[#2f6f9f] bg-white text-sm font-bold'>
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className='font-semibold'>{currentStepInfo[1]}</span>
          </div>
          <ArrowRight className='size-4 rotate-90 transition-transform group-open:-rotate-90' />
        </summary>
        <div className='grid border-t border-[#edf1f4] p-2'>
          {steps.map(([step, label], index) => (
            <div
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold',
                index === activeIndex
                  ? 'bg-[#e7f1f8] text-[#2f6f9f]'
                  : index < activeIndex
                    ? 'text-[#2f6f9f]'
                    : 'text-slate-500'
              )}
            >
              <span
                className={cn(
                  'grid size-8 place-items-center rounded-full border text-xs font-bold',
                  index <= activeIndex
                    ? 'border-[#2f6f9f] bg-white text-[#2f6f9f]'
                    : 'border-slate-200 bg-white text-slate-500'
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {label}
            </div>
          ))}
        </div>
      </details>

      <div className='hidden min-w-0 overflow-hidden rounded-2xl sm:flex'>
        {steps.map(([step, label], index) => (
          <div
            key={step}
            className={cn(
              'relative -ms-3 flex min-h-16 min-w-0 flex-1 items-center gap-2 border-r border-[#edf1f4] px-4 py-3 text-sm font-semibold transition-all first:ms-0 last:border-r-0',
              index <= activeIndex
                ? 'bg-[#e7f1f8] text-[#2f6f9f]'
                : 'bg-white text-slate-500'
            )}
            style={{
              clipPath:
                index === 0
                  ? 'polygon(0 0, calc(100% - 1rem) 0, 100% 50%, calc(100% - 1rem) 100%, 0 100%)'
                  : index === steps.length - 1
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 1rem 50%)'
                    : 'polygon(0 0, calc(100% - 1rem) 0, 100% 50%, calc(100% - 1rem) 100%, 0 100%, 1rem 50%)',
            }}
          >
            <span
              className={cn(
                'ms-3 grid size-9 shrink-0 place-items-center rounded-full border text-sm font-bold',
                index <= activeIndex
                  ? 'border-[#2f6f9f] bg-white text-[#2f6f9f]'
                  : 'border-slate-200 bg-white text-slate-500'
              )}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className='truncate'>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const IdentityStep = ({
  boleta,
  identityError,
  cryptoReady,
  isLoadingProof,
  isEstadoRevotoError,
  onConfirm,
}: {
  boleta: BoletaDigital
  identityError: string | null
  cryptoReady: boolean
  isLoadingProof: boolean
  isEstadoRevotoError: boolean
  onConfirm: () => void
}) => (
  <div className='mx-auto grid w-full max-w-3xl gap-5'>
    <Card className='border-[#e4e7eb] bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
      <CardHeader className='text-center'>
        <div className='mx-auto grid size-14 place-items-center rounded-full bg-[#d7e9f7] text-[#2f6f9f]'>
          <ShieldCheck className='size-7' />
        </div>
        <CardTitle className='text-2xl'>Antes de votar</CardTitle>
        <CardDescription>
          Verificá los datos del comicio antes de abrir la boleta.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {cryptoReady ? (
          <div
            className='flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800'
            role='status'
            aria-label='Clave de votación efímera generada'
          >
            <Fingerprint className='size-4' aria-hidden='true' />
            Clave de votación efímera generada
          </div>
        ) : null}
        <div className='grid gap-3 rounded-2xl bg-[#f7fbfd] p-4 sm:grid-cols-2'>
          <IdentityItem label='Comicio' value={boleta.nombreEleccion} />
          <IdentityItem label='Boleta' value={boleta.titulo} />
          <IdentityItem label='Estado' value={boleta.estadoEleccion} />
          <IdentityItem
            label='Categorías habilitadas'
            value={String(boleta.categorias.length)}
          />
        </div>
        <Alert className='border-amber-200 bg-amber-50 text-amber-950'>
          <AlertTriangle className='size-4' />
          <AlertTitle>Antes de continuar</AlertTitle>
          <AlertDescription>
            Este paso habilita tu sesión de votación única. Revisá los datos del
            comicio con atención: una vez que continúes, tu boleta queda
            desvinculada de tu sesión para preservar el secreto del voto.
          </AlertDescription>
        </Alert>
        {isEstadoRevotoError ? (
          <Alert className='border-amber-200 bg-amber-50 text-amber-950'>
            <AlertTriangle className='size-4' />
            <AlertTitle>No se pudo consultar los intentos restantes</AlertTitle>
            <AlertDescription>
              Podés continuar con la votación; el contador se actualizará cuando
              el servicio esté disponible.
            </AlertDescription>
          </Alert>
        ) : null}
        {identityError && (
          <Alert variant='destructive'>
            <AlertTriangle className='size-4' />
            <AlertTitle>No se pudo validar el padrón</AlertTitle>
            <AlertDescription>{identityError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          size='lg'
          className='h-12 w-full rounded-xl bg-[#2f6f9f] text-base font-semibold text-white hover:bg-[#285f88]'
          disabled={isLoadingProof}
          onClick={onConfirm}
        >
          {isLoadingProof ? (
            <>
              <Loader2 className='size-5 animate-spin' />
              Validando sesión...
            </>
          ) : (
            <>
              Comenzar a votar
              <ArrowRight className='size-5' />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  </div>
)

/** VOTAR-325: "04:59" — formato mm:ss del contador regresivo de la BUD. */
const formatMmSs = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const RetryTooSoonPanel = ({
  remainingSeconds,
  onCooldownFinished,
  onLogout,
}: {
  remainingSeconds: number
  onCooldownFinished: () => void | Promise<void>
  onLogout: () => void
}) => {
  // VOTAR-449: el remaining lo calcula el padre con CooldownAnchor (extrapolación
  // estable). Este panel solo renderiza y, al llegar a 0, dispara el cierre de
  // sesión (VOTAR-448) sin re-anclar a un snapshot que pueda reiniciar el timer.
  const finishStartedRef = useRef(false)

  useEffect(() => {
    if (remainingSeconds > 0) {
      finishStartedRef.current = false
      return
    }
    if (finishStartedRef.current) {
      return
    }
    finishStartedRef.current = true
    void onCooldownFinished()
  }, [remainingSeconds, onCooldownFinished])

  const remainingDuration = formatCooldownDuration(remainingSeconds)
  const mmss = formatMmSs(remainingSeconds)

  return (
    <div className='mx-auto grid w-full max-w-2xl gap-5'>
      <Card
        className='border-amber-200 bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'
        data-testid='retry-too-soon-panel'
      >
        <CardHeader className='flex flex-row items-start gap-4 space-y-0'>
          <div className='grid size-14 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 ring-8 ring-amber-50'>
            <Clock3 className='size-6' />
          </div>
          <div className='space-y-1'>
            <CardTitle>Debe esperar antes de volver a votar</CardTitle>
            <CardDescription>
              Debe esperar {remainingDuration} antes de volver a votar. Por
              favor, intente nuevamente más tarde.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className='border-amber-200 bg-amber-50 text-amber-950'>
            <Clock3 className='size-4' />
            <AlertTitle>Tiempo restante</AlertTitle>
            <AlertDescription aria-live='polite'>
              Próximo retry en{' '}
              <span
                className='font-mono font-semibold tabular-nums'
                data-testid='retry-too-soon-countdown'
              >
                {mmss}
              </span>{' '}
              ({remainingDuration}).
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant='outline'
            size='lg'
            className='h-12 w-full'
            onClick={onLogout}
          >
            <LogOut className='size-4' />
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

const MaxVotesReachedPanel = ({
  maxVotos,
  onLogout,
}: {
  maxVotos: number
  onLogout: () => void
}) => (
  <div className='mx-auto grid w-full max-w-2xl gap-5'>
    <Card
      className='border-slate-200 bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'
      data-testid='max-votes-reached-panel'
    >
      <CardHeader className='flex flex-row items-start gap-4 space-y-0'>
        <div className='grid size-14 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 ring-8 ring-slate-50'>
          <Ban className='size-6' />
        </div>
        <div className='space-y-1'>
          <CardTitle>Alcanzaste el límite máximo de votos</CardTitle>
          <CardDescription>
            Ya utilizaste los {maxVotos} intentos de sufragio admitidos para
            este comicio institucional. La boleta interactiva no está
            disponible.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className='border-[#2f6f9f]/20 bg-[#f7fbfd] text-slate-800'>
          <ShieldCheck className='size-4 text-[#2f6f9f]' />
          <AlertTitle>Política de re-voto</AlertTitle>
          <AlertDescription>
            Solo se computa el último voto válido emitido dentro del límite
            configurado por la autoridad electoral.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button
          variant='outline'
          size='lg'
          className='h-12 w-full'
          onClick={onLogout}
        >
          <LogOut className='size-4' />
          Cerrar sesión
        </Button>
      </CardFooter>
    </Card>
  </div>
)

const RegisteredVoteStep = ({
  votosConsumidos,
  intentosRestantes,
  ultimoIntentoLabel,
  onLogout,
  onModify,
}: {
  votosConsumidos: number
  intentosRestantes: number
  ultimoIntentoLabel: string | null
  onLogout: () => void
  onModify: () => void
}) => (
  <div className='mx-auto grid w-full max-w-2xl gap-5'>
    <Card className='border-amber-200 bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
      <CardHeader className='flex flex-row items-start gap-4 space-y-0'>
        <div className='grid size-14 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 ring-8 ring-amber-50'>
          <Clock3 className='size-6' />
        </div>
        <div className='space-y-1'>
          <CardTitle>Ya tienes un voto registrado en este comicio.</CardTitle>
          <CardDescription>
            Detectamos {votosConsumidos} emisión
            {votosConsumidos === 1 ? '' : 'es'} previa
            {votosConsumidos === 1 ? '' : 's'}. Todavía te quedan{' '}
            {intentosRestantes} intento{intentosRestantes === 1 ? '' : 's'}.
          </CardDescription>
        </div>
      </CardHeader>
      {ultimoIntentoLabel ? (
        <CardContent>
          <div className='rounded-2xl bg-amber-50 p-4 text-sm text-amber-950'>
            <span className='font-semibold'>Fecha/hora del voto anterior:</span>{' '}
            {ultimoIntentoLabel}
          </div>
        </CardContent>
      ) : null}
      <CardFooter className='grid gap-3 sm:grid-cols-2'>
        <Button variant='outline' size='lg' className='h-12' onClick={onLogout}>
          <LogOut className='size-4' />
          Cerrar sesión
        </Button>
        <Button
          size='lg'
          className='h-12 bg-[#2f6f9f] text-white hover:bg-[#285f88]'
          onClick={onModify}
        >
          <PenLine className='size-4' />
          Modificar mi voto
        </Button>
      </CardFooter>
    </Card>
  </div>
)

const SelectionStep = ({
  variant,
  selectedListId,
  specialVote,
  candidateSelections,
  canContinue,
  permitirVotoNulo,
  lists,
  roles,
  candidates,
  onSpecialVote,
  onSelectList,
  onSelectCandidate,
  onSelectBlank,
  onContinue,
}: {
  variant: VotingVariant
  selectedListId: string | null
  specialVote: SpecialVote
  candidateSelections: Record<string, string[]>
  canContinue: boolean
  permitirVotoNulo: boolean
  lists: PartyList[]
  roles: CandidateRole[]
  candidates: Candidate[]
  onSpecialVote: (value: Exclude<SpecialVote, null>) => void
  onSelectList: (listId: string | null) => void
  onSelectCandidate: (roleId: string, candidateId: string) => void
  onSelectBlank: (roleId: string) => void
  onContinue: () => void
}) => {
  const specialDescription = permitirVotoNulo
    ? 'También podés emitir tu voto en blanco o anularlo.'
    : 'También podés emitir tu voto en blanco.'

  // VOTAR-464: "por cargo" muestra un cargo a la vez (tabs), en vez de todos
  // los roles en una grilla — reduce la carga cognitiva cuando hay varios
  // cargos. La lista completa es un atajo disponible ahí mismo para tomar
  // todos los cargos de una: elegirla precarga cada tab, que igual queda
  // editable de forma individual (corte de boleta).
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const activeRoleIndex = Math.max(
    0,
    roles.findIndex((role) => role.id === activeRoleId)
  )
  const effectiveActiveRoleId =
    activeRoleId && roles.some((role) => role.id === activeRoleId)
      ? activeRoleId
      : (roles[0]?.id ?? null)
  const isRoleResolved = (roleId: string) =>
    (candidateSelections[roleId] ?? []).length > 0
  const rolesWithCandidates = roles.filter((role) =>
    candidates.some((candidate) => candidate.roleId === role.id)
  )
  // roleId ya cuenta como resuelto: es el que se acaba de elegir en este
  // click, antes de que el estado del padre (candidateSelections) se
  // actualice y vuelva a renderizar.
  const willAllRolesBeResolved = (roleId: string) =>
    rolesWithCandidates.every(
      (role) => role.id === roleId || isRoleResolved(role.id)
    )

  const goToRole = (roleId: string) => setActiveRoleId(roleId)
  const advanceFromRole = (roleId: string) => {
    const index = roles.findIndex((role) => role.id === roleId)
    const next = roles[index + 1]
    if (next) setActiveRoleId(next.id)
  }
  // VOTAR-464: si esta elección resuelve el último cargo pendiente, no hay
  // más tabs a las que avanzar — se avanza directo al siguiente paso del
  // wizard en vez de dejar al votante con un botón "Continuar" redundante.
  // VOTAR-474: en multi-selección no auto-avanza hasta alcanzar el máximo
  // (o blanco), para permitir elegir N candidatos del mismo cargo.
  const handleStepSelectCandidate = (roleId: string, candidateId: string) => {
    const role = roles.find((item) => item.id === roleId)
    const maxSelecciones = role?.maxSelecciones ?? 1
    const existing = (candidateSelections[roleId] ?? []).filter(
      (id) => !isBlankSelection(id)
    )
    const isDeselect = maxSelecciones > 1 && existing.includes(candidateId)
    const nextCount = isDeselect
      ? existing.length - 1
      : existing.includes(candidateId)
        ? existing.length
        : existing.length + 1
    const atCapacity =
      maxSelecciones <= 1 || (!isDeselect && nextCount >= maxSelecciones)

    onSelectCandidate(roleId, candidateId)

    if (isDeselect || !atCapacity) {
      return
    }

    if (willAllRolesBeResolved(roleId)) {
      onContinue()
    } else {
      advanceFromRole(roleId)
    }
  }
  const handleStepSelectBlank = (roleId: string) => {
    onSelectBlank(roleId)
    if (willAllRolesBeResolved(roleId)) {
      onContinue()
    } else {
      advanceFromRole(roleId)
    }
  }

  const activeRole = roles.find((role) => role.id === effectiveActiveRoleId)
  const selectionHint =
    activeRole && activeRole.maxSelecciones > 1
      ? `Podés elegir hasta ${activeRole.maxSelecciones} candidatos en ${activeRole.name}. Cargo ${activeRoleIndex + 1} de ${roles.length}.`
      : `Elegí un candidato o voto en blanco para cada cargo. Cargo ${activeRoleIndex + 1} de ${roles.length}.`

  const handleSelectGroupList = (listId: string) =>
    onSelectList(selectedListId === listId ? null : listId)

  return (
    <div className='grid gap-5'>
      {variant === 'lista-completa' && (
        <Card className='border-[#e4e7eb] bg-white/95'>
          <CardHeader>
            <CardTitle>Listas completas</CardTitle>
            <CardDescription>
              Elegí una lista para tomar toda la boleta como base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={BUD_LIST_GRID_CLASS} data-testid='bud-list-grid'>
              {lists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  roles={roles}
                  candidates={candidates}
                  selected={selectedListId === list.id}
                  onSelect={() =>
                    onSelectList(selectedListId === list.id ? null : list.id)
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!specialVote && variant === 'candidatos' && (
        <Card className='border-[#e4e7eb] bg-white/95'>
          <CardHeader>
            <CardTitle>Candidatos por rol</CardTitle>
            <CardDescription>{selectionHint}</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-5'>
            {roles.length > 1 && (
              <div
                role='tablist'
                aria-label='Cargos'
                className='flex flex-wrap gap-2'
              >
                {roles.map((role) => {
                  const resolved = isRoleResolved(role.id)
                  const active = role.id === effectiveActiveRoleId
                  return (
                    <button
                      key={role.id}
                      type='button'
                      role='tab'
                      id={`cargo-tab-${role.id}`}
                      aria-controls={`cargo-panel-${role.id}`}
                      aria-selected={active}
                      onClick={() => goToRole(role.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                        active
                          ? 'border-[#2f6f9f] bg-[#2f6f9f] text-white'
                          : resolved
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-[#dbe3ea] bg-white text-slate-600 hover:bg-[#f7fbfd]'
                      )}
                    >
                      {resolved && !active && (
                        <Check className='size-3.5' aria-hidden='true' />
                      )}
                      {role.name}
                    </button>
                  )
                })}
              </div>
            )}
            <div className='grid gap-5' data-testid='bud-category-grid'>
              {roles
                .filter((role) => role.id === effectiveActiveRoleId)
                .map((role) => (
                  <div
                    key={role.id}
                    id={`cargo-panel-${role.id}`}
                    role='tabpanel'
                    aria-labelledby={`cargo-tab-${role.id}`}
                  >
                    <CandidateRoleSection
                      roleId={role.id}
                      roleName={role.name}
                      maxSelecciones={role.maxSelecciones}
                      candidates={candidates}
                      selectedCandidateIds={candidateSelections[role.id] ?? []}
                      groupByParty
                      selectedListId={selectedListId}
                      onSelectCandidate={handleStepSelectCandidate}
                      onSelectBlank={handleStepSelectBlank}
                      onSelectList={handleSelectGroupList}
                    />
                  </div>
                ))}
            </div>
            {roles.length > 1 && (
              <div className='flex items-center justify-between gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={activeRoleIndex === 0}
                  onClick={() => {
                    const prev = roles[activeRoleIndex - 1]
                    if (prev) goToRole(prev.id)
                  }}
                >
                  <ArrowLeft className='size-4' />
                  Cargo anterior
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={activeRoleIndex >= roles.length - 1}
                  onClick={() => {
                    const next = roles[activeRoleIndex + 1]
                    if (next) goToRole(next.id)
                  }}
                >
                  Siguiente cargo
                  <ArrowRight className='size-4' />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className='border-[#e4e7eb] bg-white/95'>
        <CardHeader>
          <CardTitle>Opciones especiales</CardTitle>
          <CardDescription>{specialDescription}</CardDescription>
        </CardHeader>
        <CardContent
          className={cn(
            'grid gap-3',
            permitirVotoNulo ? 'md:grid-cols-2' : 'md:grid-cols-1'
          )}
        >
          <SpecialVoteCard
            title='Votar en blanco'
            description='No selecciona listas ni candidatos.'
            icon={<CircleOff className='size-14 sm:size-20' />}
            selected={specialVote === 'blank'}
            onSelect={() => onSpecialVote('blank')}
          />
          {permitirVotoNulo && (
            <SpecialVoteCard
              title='Anular voto'
              description='Registra una boleta anulada para este comicio.'
              icon={<Ban className='size-14 sm:size-20' />}
              selected={specialVote === 'null'}
              onSelect={() => onSpecialVote('null')}
            />
          )}
        </CardContent>
      </Card>

      <div className={BUD_STICKY_CTA_CLASS}>
        <Button
          size='lg'
          className='h-12 w-full rounded-xl bg-[#2f6f9f] px-8 font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-[#285f88] sm:w-auto sm:min-w-48'
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continuar
          <ArrowRight className='size-5' />
        </Button>
      </div>
    </div>
  )
}

const ReviewStep = ({
  variant,
  selectedList,
  selectedCandidates,
  candidateSelections,
  specialVote,
  wholeBallotBlank,
  roles,
  candidates,
  signingError,
  isSigning,
  pausada = false,
  onBack,
  onSign,
}: {
  variant: VotingVariant
  selectedList?: PartyList
  selectedCandidates: Candidate[]
  candidateSelections: Record<string, string[]>
  specialVote: SpecialVote
  wholeBallotBlank: boolean
  roles: CandidateRole[]
  candidates: Candidate[]
  signingError: string | null
  isSigning: boolean
  pausada?: boolean
  onBack: () => void
  onSign: () => void
}) => {
  const rolesWithCandidates = roles.filter((role) =>
    candidates.some((candidate) => candidate.roleId === role.id)
  )
  const showPerRoleSummary =
    !specialVote &&
    !wholeBallotBlank &&
    (variant === 'candidatos' || selectedCandidates.length > 0)

  return (
    <div className='mx-auto grid w-full max-w-4xl gap-5'>
      <Card className='border-[#e4e7eb] bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
        <CardHeader>
          <CardTitle>Confirmar Voto</CardTitle>
          <CardDescription>
            Revisá el resumen antes de firmar la boleta de forma local.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-5'>
          {(specialVote === 'blank' || wholeBallotBlank) && (
            <SpecialVoteSummary specialVote='blank' />
          )}
          {specialVote === 'null' && <SpecialVoteSummary specialVote='null' />}

          {selectedList && variant !== 'candidatos' && !specialVote && (
            <div className='rounded-2xl border border-[#dbe3ea] p-4'>
              <p className='mb-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
                Lista seleccionada
              </p>
              <div className='flex items-center gap-3'>
                <ListLogo list={selectedList} />
                <div>
                  <p className='font-semibold'>{selectedList.name}</p>
                  <p className='text-sm text-slate-500'>
                    Lista {selectedList.initials}
                  </p>
                </div>
              </div>
              <ListCandidatesOverview
                list={selectedList}
                roles={roles}
                candidates={candidates}
              />
            </div>
          )}

          {showPerRoleSummary && (
            <div className='overflow-hidden rounded-2xl border border-[#dbe3ea]'>
              <div className='bg-[#f7fbfd] px-4 py-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
                Candidatos por rol
              </div>
              <div className='divide-y'>
                {rolesWithCandidates.map((role) => {
                  if (roleHasBlankSelection(candidateSelections, role.id)) {
                    return (
                      <div key={role.id} className='px-4 py-3'>
                        <p className='text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
                          {role.name}
                        </p>
                        <p className='mt-1 font-semibold text-slate-700'>
                          Voto en blanco
                        </p>
                      </div>
                    )
                  }

                  const roleCandidates = selectedCandidates.filter(
                    (candidate) => candidate.roleId === role.id
                  )
                  if (roleCandidates.length === 0) {
                    return null
                  }

                  return (
                    <div key={role.id} className='grid gap-2 px-4 py-3'>
                      {roleCandidates.length > 1 && (
                        <p className='text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
                          {role.name}
                        </p>
                      )}
                      {roleCandidates.map((roleCandidate) => (
                        <CandidateReviewItem
                          key={roleCandidate.id}
                          candidate={roleCandidate}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {signingError && (
            <Alert variant='destructive'>
              <AlertTriangle className='size-4' />
              <AlertTitle>No se pudo firmar el voto</AlertTitle>
              <AlertDescription>{signingError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className='grid gap-3 sm:grid-cols-[1fr_1.5fr]'>
          <Button
            variant='outline'
            size='lg'
            className='h-12'
            disabled={isSigning}
            onClick={onBack}
          >
            <ArrowLeft className='size-4' />
            Volver
          </Button>
          <Button
            size='lg'
            className='h-12 bg-[#2f6f9f] font-semibold text-white hover:bg-[#285f88]'
            disabled={isSigning || pausada}
            onClick={onSign}
            aria-label={
              pausada
                ? 'Votación deshabilitada: comicio en pausa'
                : 'Firmar y confirmar voto'
            }
          >
            {isSigning ? (
              <>
                <Loader2 className='size-5 animate-spin' />
                Firmando voto...
              </>
            ) : pausada ? (
              <>
                <AlertCircle className='size-5' />
                Votación pausada
              </>
            ) : (
              <>
                <Fingerprint className='size-5' />
                Firmar y confirmar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

const SuccessStep = ({
  voteReceiptReady,
  txHash,
  blockNumber,
  idEleccion,
  nombreEleccion,
  signingError,
  onLogout,
  onModify,
}: {
  voteReceiptReady: boolean
  txHash: Hex | null
  blockNumber: number | null
  idEleccion: number
  nombreEleccion: string
  signingError: string | null
  onLogout: () => void
  onModify: () => void
}) => {
  const explorerUrl = txHash ? getExplorerTxUrl(txHash) : null
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const handleDownloadPdf = async () => {
    if (!txHash || blockNumber === null) {
      setPdfError(
        'Falta el hash o el número de bloque para generar el comprobante.'
      )
      return
    }

    setIsDownloadingPdf(true)
    setPdfError(null)
    try {
      const timestamp = new Date().toISOString()
      const firma = await firmarRecibo({
        idEleccion,
        txHash,
        blockNumber,
        timestamp,
      })
      await generarReciboPDF({
        idEleccion,
        nombreEleccion,
        txHash,
        timestamp,
        blockNumber,
        firmaDigital: firma.firmaDigital,
      })
    } catch (error) {
      setPdfError(
        error instanceof Error
          ? error.message
          : 'No se pudo generar el comprobante PDF.'
      )
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className='mx-auto grid w-full max-w-2xl gap-5'>
      <Card className='border-[#d7eadf] bg-white/95 text-center shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
        <CardHeader>
          <div className='mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700'>
            <CheckCircle2 className='size-9' />
          </div>
          <CardTitle className='text-2xl'>Voto Exitoso</CardTitle>
          <CardDescription>
            {txHash
              ? `Voto registrado exitosamente (hash: ${txHash}).`
              : 'Su voto ha sido firmado con éxito.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 text-left'>
          {voteReceiptReady && (
            <div className='rounded-2xl bg-slate-50 p-4'>
              <p className='mb-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
                Comprobante criptográfico
              </p>
              <p className='text-sm text-slate-700'>
                Tu boleta quedó protegida con firma digital local y registrada
                de forma inmutable en la blockchain. Descargá el PDF firmado por
                el sistema de auditoría; se genera solo en tu navegador y no se
                almacena en el servidor.
              </p>
              {txHash && (
                <div className='mt-3 rounded-xl bg-white p-3 text-sm break-all text-slate-700'>
                  <p className='mb-1 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
                    Hash de transacción
                  </p>
                  <p aria-label={`Hash de transacción ${txHash}`}>{txHash}</p>
                  {blockNumber !== null && (
                    <p className='mt-2 text-xs text-slate-500'>
                      Bloque: {blockNumber}
                    </p>
                  )}
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='mt-2 inline-flex items-center gap-1 text-[#2f6f9f] underline-offset-2 hover:underline'
                      aria-label='Ver transacción en el explorador de bloques'
                    >
                      Ver en explorador
                      <ExternalLink className='size-3.5' />
                    </a>
                  )}
                </div>
              )}
              {pdfError && (
                <Alert variant='destructive' className='mt-3'>
                  <AlertTriangle className='size-4' />
                  <AlertTitle>No se pudo descargar el PDF</AlertTitle>
                  <AlertDescription>{pdfError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {signingError && (
            <Alert variant='destructive'>
              <AlertTriangle className='size-4' />
              <AlertTitle>No se pudo continuar</AlertTitle>
              <AlertDescription>{signingError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className='grid gap-3'>
          {voteReceiptReady && txHash && (
            <Button
              size='lg'
              className='h-12 w-full'
              onClick={() => {
                void handleDownloadPdf()
              }}
              disabled={isDownloadingPdf || blockNumber === null}
              aria-busy={isDownloadingPdf}
              aria-label='Descargar comprobante PDF de participación'
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className='size-4' />
                  Descargar comprobante PDF
                </>
              )}
            </Button>
          )}
          <Button
            variant='outline'
            size='lg'
            className='h-12 w-full'
            onClick={onModify}
            aria-label='Modificar mi voto'
          >
            <PenLine className='size-4' />
            Modificar mi voto
          </Button>
          <Button
            variant='ghost'
            size='lg'
            className='h-12 w-full'
            onClick={onLogout}
          >
            <LogOut className='size-4' />
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

const TransmitStep = ({
  phase,
  txError,
  specialVote,
  wholeBallotBlank,
  candidateSelections,
  selectedList,
  selectedCandidates,
  roles,
  onRetrySend,
  onResign,
  onBackToSelection,
}: {
  phase: TransmitUiPhase | null
  txError: VoteTxError | null
  specialVote: SpecialVote
  wholeBallotBlank: boolean
  candidateSelections: Record<string, string[]>
  selectedList?: PartyList
  selectedCandidates: Candidate[]
  roles: CandidateRole[]
  onRetrySend: () => void
  onResign: () => void
  onBackToSelection: () => void
}) => {
  const isBusy = phase !== 'error' && phase !== null
  const statusLabel =
    phase === 'estimating' || phase === 'sending'
      ? 'Enviando...'
      : phase === 'confirming'
        ? 'Esperando confirmación de red (minado)...'
        : phase === 'reconciling'
          ? 'Reconciliando voto registrado previamente...'
          : phase === 'error'
            ? 'No se pudo completar el envío'
            : 'Preparando envío...'
  const blankRoles = roles.filter((role) =>
    roleHasBlankSelection(candidateSelections, role.id)
  )

  return (
    <div className='mx-auto grid w-full max-w-2xl gap-5'>
      <Card className='border-[#e4e7eb] bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
        <CardHeader className='text-center'>
          <div
            className={cn(
              'mx-auto grid size-16 place-items-center rounded-full',
              phase === 'error'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-100 text-[#2f6f9f]'
            )}
          >
            {phase === 'error' ? (
              <AlertTriangle className='size-9' />
            ) : (
              <Loader2 className='size-9 animate-spin' />
            )}
          </div>
          <CardTitle className='text-2xl'>Registro en blockchain</CardTitle>
          <CardDescription aria-live='polite'>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='rounded-2xl bg-slate-50 p-4 text-sm text-slate-700'>
            <p className='mb-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
              Tu selección se conserva
            </p>
            {(specialVote === 'blank' || wholeBallotBlank) && (
              <p>Voto en blanco</p>
            )}
            {specialVote === 'null' && <p>Voto nulo</p>}
            {!specialVote && !wholeBallotBlank && selectedList && (
              <p>Lista: {selectedList.name}</p>
            )}
            {!specialVote &&
              !wholeBallotBlank &&
              (selectedCandidates.length > 0 || blankRoles.length > 0) && (
                <ul className='mt-2 list-disc space-y-1 pl-5'>
                  {selectedCandidates.map((candidate) => (
                    <li key={candidate.id}>{candidate.name}</li>
                  ))}
                  {blankRoles.map((role) => (
                    <li key={role.id}>{role.name}: Voto en blanco</li>
                  ))}
                </ul>
              )}
          </div>

          {txError && <VoteTransmitErrorAlert error={txError} />}
        </CardContent>
        <CardFooter className='grid gap-3'>
          {txError?.canRetrySend && (
            <Button
              size='lg'
              className='h-12 bg-[#2f6f9f] font-semibold text-white hover:bg-[#285f88]'
              disabled={isBusy}
              onClick={onRetrySend}
              aria-label='Reintentar envío del voto'
            >
              <RefreshCw className='size-4' />
              Reintentar envío
            </Button>
          )}
          {txError?.canResign && (
            <Button
              variant='outline'
              size='lg'
              className='h-12'
              disabled={isBusy}
              onClick={onResign}
              aria-label='Volver a firmar el voto'
            >
              <Fingerprint className='size-4' />
              Re-firmar
            </Button>
          )}
          {phase === 'error' && (
            <Button
              variant='ghost'
              size='lg'
              className='h-12'
              disabled={isBusy}
              onClick={onBackToSelection}
            >
              <ArrowLeft className='size-4' />
              Volver a la selección
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

const IdentityItem = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-xl bg-white p-3 shadow-sm'>
    <p className='text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
      {label}
    </p>
    <p className='mt-1 font-semibold text-slate-900'>{value}</p>
  </div>
)

const SpecialVoteCard = ({
  title,
  description,
  icon,
  selected,
  onSelect,
}: {
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}) => (
  <button
    type='button'
    aria-pressed={selected}
    aria-label={`${title}. ${description}`}
    className={cn(
      'relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none',
      selected
        ? 'border-slate-700 shadow-md shadow-slate-900/10'
        : 'border-[#dbe3ea]'
    )}
    onClick={onSelect}
  >
    <span className='pointer-events-none absolute -right-3 -bottom-5 text-slate-400/20'>
      {icon}
    </span>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='font-semibold'>{title}</p>
        <p className='mt-1 text-sm text-slate-500'>{description}</p>
      </div>
      {selected && (
        <span className='grid size-7 shrink-0 place-items-center rounded-full bg-slate-700 text-white'>
          <Check className='size-4' />
        </span>
      )}
    </div>
  </button>
)

const SpecialVoteSummary = ({ specialVote }: { specialVote: SpecialVote }) => {
  const isBlankVote = specialVote === 'blank'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white p-5 shadow-md',
        isBlankVote
          ? 'border-slate-700 shadow-slate-900/10'
          : 'border-[#2f6f9f] shadow-[#2f6f9f]/10'
      )}
      role='status'
      aria-live='polite'
    >
      <span
        className={cn(
          'pointer-events-none absolute -right-3 -bottom-5',
          isBlankVote ? 'text-slate-400/20' : 'text-[#2f6f9f]/10'
        )}
      >
        {isBlankVote ? (
          <CircleOff className='size-24' aria-hidden='true' />
        ) : (
          <Ban className='size-24' aria-hidden='true' />
        )}
      </span>
      <p className='text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
        Selección especial
      </p>
      <p className='mt-2 text-xl font-bold text-slate-950'>
        {isBlankVote ? 'Voto en blanco' : 'Voto anulado'}
      </p>
      <p className='mt-1 max-w-xl text-sm text-slate-600'>
        {isBlankVote
          ? 'No se registrarán listas ni candidatos seleccionados.'
          : 'Se registrará una boleta anulada para este comicio.'}
      </p>
    </div>
  )
}

const ListCard = ({
  list,
  roles,
  candidates,
  selected,
  onSelect,
}: {
  list: PartyList
  roles: CandidateRole[]
  candidates: Candidate[]
  selected: boolean
  onSelect: () => void
}) => {
  const listCandidates = candidates.filter(
    (candidate) => candidate.listId === list.id
  )

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg',
        selected
          ? 'border-[#2f6f9f] shadow-lg shadow-[#2f6f9f]/10'
          : 'border-[#dbe3ea]'
      )}
    >
      <button
        type='button'
        className='w-full p-5 text-left transition-colors hover:bg-[#f7fbfd] focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none'
        onClick={onSelect}
      >
        <div className='flex items-start gap-4'>
          <ListLogo list={list} />
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-base font-bold break-words sm:text-lg'>
                  {list.name}
                </p>
              </div>
              {selected && (
                <span className='grid size-7 shrink-0 place-items-center rounded-full bg-[#2f6f9f] text-white'>
                  <Check className='size-4' />
                </span>
              )}
            </div>
          </div>
        </div>
        <ListCandidatesOverview
          list={list}
          roles={roles}
          candidates={listCandidates}
          showDetails={false}
        />
      </button>
      <div className='px-5 pb-5'>
        <ListCandidatesOverview
          list={list}
          roles={roles}
          candidates={listCandidates}
          showPrimary={false}
        />
      </div>
    </div>
  )
}

const ListCandidatesOverview = ({
  list,
  roles,
  candidates,
  showPrimary = true,
  showDetails = true,
}: {
  list: PartyList
  roles: CandidateRole[]
  candidates: Candidate[]
  showPrimary?: boolean
  showDetails?: boolean
}) => {
  const listCandidates = candidates.filter(
    (candidate) => candidate.listId === list.id
  )
  // VOTAR-464: sólo se muestra el primer cargo de la lista de entrada; el
  // resto queda detrás de "Ver resto de candidatos".
  const primaryCandidates = roles
    .map((role) =>
      listCandidates.find((candidate) => candidate.roleId === role.id)
    )
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .slice(0, 1)
  const primaryCandidateIds = new Set(
    primaryCandidates.map((candidate) => candidate.id)
  )
  const remainingRoles = roles
    .map((role) => ({
      ...role,
      candidates: listCandidates.filter(
        (candidate) =>
          candidate.roleId === role.id && !primaryCandidateIds.has(candidate.id)
      ),
    }))
    .filter((role) => role.candidates.length > 0)

  return (
    // VOTAR-464: `@container` en vez de `sm:` — esta previsualización vive
    // adentro de una ListCard que a su vez es celda de una grilla de hasta 3
    // columnas, así que el ancho real disponible casi nunca coincide con el
    // viewport. Con `sm:grid-cols-2` el nombre del candidato quedaba con muy
    // poco lugar y se truncaba de más.
    <div className={cn('@container', showPrimary && 'mt-4')}>
      {showPrimary &&
        primaryCandidates.map((candidate) => (
          <CandidatePreview key={candidate.id} candidate={candidate} />
        ))}

      {showDetails && (
        <details
          className={cn(
            'group rounded-xl border border-[#edf1f4] bg-white',
            showPrimary && 'mt-4'
          )}
        >
          <summary className='flex list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#2f6f9f] transition-colors hover:bg-[#f7fbfd] [&::-webkit-details-marker]:hidden'>
            Ver resto de candidatos
            <ArrowRight className='size-4 rotate-90 transition-transform group-open:-rotate-90' />
          </summary>
          <div className='grid gap-4 px-4 pb-4'>
            {remainingRoles.length === 0 ? (
              <p className='rounded-xl bg-slate-50 p-3 text-sm text-slate-500'>
                No hay más candidatos registrados para esta lista.
              </p>
            ) : (
              remainingRoles.map((role) => (
                <div key={role.id} className='grid gap-2'>
                  <p className='text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
                    {role.name}
                  </p>
                  <div className='grid grid-cols-1 gap-2 @[22rem]:grid-cols-2'>
                    {role.candidates.map((candidate) => (
                      <CandidatePreview
                        key={candidate.id}
                        candidate={candidate}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  )
}

const CandidatePreview = ({ candidate }: { candidate: Candidate }) => (
  <div className='flex items-center gap-3 rounded-xl bg-[#f7fbfd] p-3'>
    <CandidateAvatar
      candidate={candidate}
      className='size-11 shrink-0 rounded-xl'
    />
    <div className='min-w-0 flex-1'>
      <p className='truncate text-sm font-semibold'>{candidate.name}</p>
      <p className='truncate text-xs text-slate-500'>{candidate.role}</p>
    </div>
  </div>
)

const CandidateRoleSection = ({
  roleId,
  roleName,
  maxSelecciones = 1,
  candidates,
  selectedCandidateIds,
  groupByParty,
  selectedListId,
  onSelectCandidate,
  onSelectBlank,
  onSelectList,
}: {
  roleId: string
  roleName: string
  maxSelecciones?: number
  candidates: Candidate[]
  selectedCandidateIds: string[]
  groupByParty: boolean
  selectedListId?: string | null
  onSelectCandidate: (roleId: string, candidateId: string) => void
  onSelectBlank: (roleId: string) => void
  /** Atajo para tomar la lista completa de este partido como base de toda la
   * boleta (todos los cargos), sin dejar de poder cambiar cada candidato
   * individualmente después ("corte de boleta"). */
  onSelectList?: (listId: string) => void
}) => {
  const roleCandidates = candidates.filter(
    (candidate) => candidate.roleId === roleId
  )
  const isBlankSelected = selectedCandidateIds.includes(BLANK_SELECTION_ID)
  const selectedCount = selectedCandidateIds.filter(
    (id) => !isBlankSelection(id)
  ).length
  const groupedCandidates = groupByParty
    ? groupCandidatesByParty(roleCandidates)
    : [
        {
          id: 'all',
          name: '',
          color: '',
          initials: '',
          imageUrl: null,
          candidates: roleCandidates,
        },
      ]
  const selectionBadge = isBlankSelected
    ? 'Voto en blanco'
    : selectedCount > 0
      ? maxSelecciones > 1
        ? `${selectedCount} de ${maxSelecciones} seleccionados`
        : '1 seleccionado'
      : maxSelecciones > 1
        ? `Elegí hasta ${maxSelecciones}`
        : 'Elegí una opción'
  const groupsContent = (
    <div className='grid gap-4'>
      <div
        className={cn(
          'grid gap-4',
          // auto-fit/minmax en vez de un número fijo de columnas: con
          // grid-cols-2/3 fijo, menos partidos que columnas dejaban la card
          // del rol con una franja vacía en vez de usar todo el ancho.
          groupByParty &&
            'grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] items-stretch'
        )}
      >
        {groupedCandidates.map((group) => (
          <div
            key={group.id}
            role={groupByParty ? 'group' : undefined}
            aria-label={groupByParty ? `Agrupación ${group.name}` : undefined}
            className={cn(
              groupByParty &&
                'grid gap-3 rounded-2xl border border-[#edf1f4] bg-[#f7fbfd] p-3'
            )}
          >
            {groupByParty && (
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                  <ListLogo
                    list={group}
                    className='size-9 rounded-xl'
                    fallbackClassName='text-xs'
                  />
                  {group.name}
                </div>
                {onSelectList && (
                  <button
                    type='button'
                    aria-pressed={selectedListId === group.id}
                    aria-label={
                      selectedListId === group.id
                        ? `Lista completa ${group.name} elegida como base de la boleta`
                        : `Elegir la lista completa ${group.name} como base de la boleta`
                    }
                    onClick={() => onSelectList(group.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      selectedListId === group.id
                        ? 'border-[#2f6f9f] bg-[#2f6f9f] text-white'
                        : 'border-[#2f6f9f]/40 bg-white text-[#2f6f9f] hover:bg-[#f7fbfd]'
                    )}
                  >
                    {selectedListId === group.id && (
                      <Check className='size-3.5' aria-hidden='true' />
                    )}
                    {selectedListId === group.id
                      ? 'Lista completa elegida'
                      : 'Elegir lista completa'}
                  </button>
                )}
              </div>
            )}
            <div className={BUD_CANDIDATE_GRID_CLASS}>
              {group.candidates.map((candidate) => {
                const isSelected = selectedCandidateIds.includes(candidate.id)
                const accessibleName = `${candidate.name}, ${candidate.listName}`

                return (
                  // VOTAR-464: la fila avatar+nombre pasaba a "row" con `sm:` en
                  // base al ancho de VIEWPORT, no de la celda — anidada 2-3
                  // grillas adentro, la celda real suele ser mucho más angosta
                  // que 640px y la foto (56px fijos) le dejaba al nombre casi
                  // nada de espacio, cortándolo (y "Lista N" ni truncaba, así
                  // que envolvía en dos líneas ilegibles). `@container` mide el
                  // ancho real de la celda para decidir cuándo pasar a fila.
                  <div key={candidate.id} className='@container'>
                    <button
                      type='button'
                      aria-pressed={isSelected}
                      aria-label={accessibleName}
                      className={cn(
                        'flex h-full w-full flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none @[15rem]:flex-row @[15rem]:gap-3 @[15rem]:p-4 @[15rem]:text-left',
                        isSelected
                          ? 'border-[#2f6f9f] shadow-md shadow-[#2f6f9f]/10'
                          : 'border-[#dbe3ea]'
                      )}
                      onClick={() => onSelectCandidate(roleId, candidate.id)}
                    >
                      <CandidateAvatar
                        candidate={candidate}
                        className='shrink-0'
                      />
                      <div className='w-full min-w-0 flex-1'>
                        <p className='truncate font-semibold'>
                          {candidate.name}
                        </p>
                        <p className='truncate text-sm text-slate-500'>
                          {candidate.listName}
                        </p>
                      </div>
                      {isSelected && (
                        <span className='grid size-7 shrink-0 place-items-center rounded-full bg-[#2f6f9f] text-white @[15rem]:ms-auto'>
                          <Check className='size-4' />
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type='button'
        aria-pressed={isBlankSelected}
        aria-label={`Voto en Blanco para ${roleName}, no seleccionar ningún candidato`}
        className={cn(
          'flex min-h-11 w-full items-center gap-4 rounded-2xl border border-dashed bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-slate-400/40 focus-visible:outline-none',
          isBlankSelected
            ? 'border-slate-700 bg-white shadow-md shadow-slate-900/10'
            : 'border-slate-300'
        )}
        onClick={() => onSelectBlank(roleId)}
      >
        <div className='grid size-14 place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500'>
          <CircleOff className='size-7' aria-hidden='true' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-semibold text-slate-900'>Voto en Blanco</p>
          <p className='text-sm text-slate-600'>
            Abstención explícita para {roleName}
          </p>
        </div>
        {isBlankSelected && (
          <span className='grid size-7 shrink-0 place-items-center rounded-full bg-slate-700 text-white'>
            <Check className='size-4' aria-hidden='true' />
          </span>
        )}
      </button>
    </div>
  )

  return (
    <section
      className='grid gap-3 rounded-2xl border border-[#dbe3ea] bg-white/95 p-4 shadow-sm'
      aria-label={roleName}
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h3 className='min-w-0 truncate font-semibold'>{roleName}</h3>
        <Badge variant='outline' className='shrink-0'>
          {selectionBadge}
        </Badge>
      </div>
      {roleCandidates.length > 20 ? (
        <ScrollArea className='max-h-[65vh] pe-3'>{groupsContent}</ScrollArea>
      ) : (
        groupsContent
      )}
    </section>
  )
}

const CandidateReviewItem = ({ candidate }: { candidate: Candidate }) => (
  <div className='flex flex-col gap-3 rounded-2xl bg-white p-3 text-sm sm:flex-row sm:items-center sm:gap-3'>
    <div className='flex shrink-0 items-center gap-3'>
      <ListLogo
        list={{
          name: candidate.listName,
          initials: candidate.listInitials,
          color: candidate.color,
          accent: getSoftAccent(candidate.color),
          imageUrl: candidate.listImageUrl,
        }}
        className='size-12 rounded-2xl sm:size-14'
      />
      <CandidateAvatar
        candidate={candidate}
        className='size-12 rounded-2xl sm:size-14'
      />
    </div>
    <div className='min-w-0 flex-1'>
      <p className='truncate font-semibold text-slate-950'>{candidate.name}</p>
      <p className='truncate text-slate-500'>{candidate.role}</p>
    </div>
  </div>
)

const CandidateAvatar = ({
  candidate,
  className,
}: {
  candidate: Candidate
  className?: string
}) => (
  <Avatar
    className={cn('size-14 rounded-xl border', className)}
    style={{ borderColor: getSoftAccent(candidate.color) }}
  >
    {candidate.imageUrl && (
      <AvatarImage
        src={resolveMediaUrl(candidate.imageUrl)}
        alt={`Foto de ${candidate.name}`}
        className='object-cover'
      />
    )}
    <AvatarFallback
      className='rounded-xl text-sm font-bold'
      style={{
        backgroundColor: getSoftAccent(candidate.color),
        color: candidate.color,
      }}
    >
      {candidate.initials}
    </AvatarFallback>
  </Avatar>
)

const ListLogo = ({
  list,
  className,
  fallbackClassName,
}: {
  list: Pick<PartyList, 'name' | 'initials' | 'imageUrl'> &
    Partial<Pick<PartyList, 'color' | 'accent'>>
  className?: string
  fallbackClassName?: string
}) => {
  const color = list.color ?? '#2f6f9f'
  const accent = list.accent ?? getSoftAccent(color)

  return (
    <Avatar
      className={cn('size-16 rounded-2xl border', className)}
      style={{ borderColor: accent }}
    >
      {list.imageUrl && (
        <AvatarImage
          src={resolveMediaUrl(list.imageUrl)}
          alt={`Imagen de ${list.name}`}
          className='object-cover'
        />
      )}
      <AvatarFallback
        className={cn('rounded-2xl text-lg font-black', fallbackClassName)}
        style={{ backgroundColor: accent, color }}
      >
        {list.initials}
      </AvatarFallback>
    </Avatar>
  )
}

const getStepLabel = (step: WizardStep) => {
  if (step === 'limit-reached') return 'Límite de intentos'
  if (step === 'cooldown') return 'Espera entre votos'
  if (step === 'registered') return 'Voto registrado'
  if (step === 'identity') return 'Antes de votar'
  if (step === 'selection') return 'Selección de voto'
  if (step === 'review') return 'Confirmación'
  if (step === 'transmitting') return 'Envío a la red'
  return 'Voto exitoso'
}
