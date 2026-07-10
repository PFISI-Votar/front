import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Fingerprint,
  Loader2,
  LogOut,
  PenLine,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
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
import type { SignedVotePayload } from '@/features/voto/crypto'
import { useEphemeralWallet } from '@/features/voto/crypto/use-ephemeral-wallet'
import type {
  BoletaDigital,
  CandidatoBoletaDigital,
  VoterMerkleProof,
} from '@/features/voto/data/schema'
import { useSolicitarMerkleProof } from '@/features/voto/hooks/use-merkle-proof'
import { buildWizardSelectionPayload } from '@/features/voto/utils/wizard-selection'

type VotingVariant = 'lista-completa' | 'candidatos' | 'mixto'
type SpecialVote = 'blank' | 'null' | null
type WizardStep = 'identity' | 'registered' | 'selection' | 'review' | 'success'

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
  cryptoReady?: boolean
  /**
   * Opaque nullifier from VOTAR-353. Required to sign (VOTAR-357).
   * When null, the confirm step explains that the nullifier is unavailable.
   */
  nullifier?: Hex | null
  onLogout: () => void
}

const PREVIOUS_VOTE_DATE = '23/06/2026, 10:42 hs'

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
  if (tipoVotacion === TIPOS_VOTACION.MIXTO) return 'mixto'
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
    }))

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

const getCandidateSelectionsForList = (
  listId: string,
  roles: CandidateRole[],
  candidates: Candidate[]
) =>
  roles.reduce<Record<string, string[]>>((selections, role) => {
    const roleCandidates = candidates.filter(
      (item) => item.listId === listId && item.roleId === role.id
    )

    if (roleCandidates.length > 0) {
      selections[role.id] = [roleCandidates[0].id]
    }

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

export const BudVotingWizard = ({
  boleta,
  tipoVotacion,
  cryptoReady = false,
  nullifier = null,
  onLogout,
}: BudVotingWizardProps) => {
  const [step, setStep] = useState<WizardStep>('identity')
  const variant = getVotingVariant(tipoVotacion)
  const [returningVoter, setReturningVoter] = useState(false)
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
  const merkleProofMutation = useSolicitarMerkleProof(boleta.idEleccion)
  const { signVotePayload, destroy: destroyEphemeralWallet } =
    useEphemeralWallet()

  const lists = useMemo(() => buildListsFromBoleta(boleta), [boleta])
  const roles = useMemo(() => buildRolesFromBoleta(boleta), [boleta])
  const candidates = useMemo(() => buildCandidatesFromBoleta(boleta), [boleta])
  const selectedList = lists.find((list) => list.id === selectedListId)
  const selectedCandidates = useMemo(
    () =>
      roles.flatMap((role) =>
        (candidateSelections[role.id] ?? [])
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
  const canContinueSelection =
    Boolean(specialVote) ||
    (variant === 'lista-completa' && Boolean(selectedList)) ||
    (variant === 'candidatos' &&
      rolesWithCandidates.every(
        (role) => (candidateSelections[role.id] ?? []).length > 0
      )) ||
    (variant === 'mixto' &&
      (Boolean(selectedList) ||
        rolesWithCandidates.every(
          (role) => (candidateSelections[role.id] ?? []).length > 0
        )))

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
  }

  const handleSelectList = (listId: string | null) => {
    setSpecialVote(null)
    setSelectedListId(listId)

    if (variant === 'mixto') {
      setCandidateSelections(
        listId ? getCandidateSelectionsForList(listId, roles, candidates) : {}
      )
    }
  }

  const handleIdentityConfirm = async () => {
    setIdentityError(null)
    try {
      const proof = await merkleProofMutation.mutateAsync()
      setMerkleProofData(proof)
      setStep(returningVoter ? 'registered' : 'selection')
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

    if (!nullifier) {
      setSigningError(
        'No hay un nulificador de sesión disponible. Completá el cálculo del nulificador antes de firmar.'
      )
      return
    }

    setIsSigning(true)

    try {
      const selection = buildWizardSelectionPayload({
        specialVote,
        candidateSelections,
        selectedListId,
        roles,
        candidates,
      })
      const signed = await signVotePayload(selection, nullifier)
      setSignedVote(signed)
      setStep('success')
    } catch {
      setSigningError(
        'No pudimos firmar tu voto de forma local. Reintentá en unos segundos.'
      )
    } finally {
      setIsSigning(false)
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

  return (
    <BudWizardShell step={step}>
      <WizardStepper currentStep={step} />
      <div
        key={step}
        className='animate-in duration-300 fade-in-0 slide-in-from-bottom-3'
      >
        {step === 'identity' && (
          <IdentityStep
            boleta={boleta}
            returningVoter={returningVoter}
            identityError={identityError}
            cryptoReady={cryptoReady}
            isLoadingProof={merkleProofMutation.isPending}
            onReturningVoterChange={setReturningVoter}
            onConfirm={() => {
              void handleIdentityConfirm()
            }}
          />
        )}
        {step === 'registered' && (
          <RegisteredVoteStep
            onLogout={handleLogout}
            onModify={() => {
              resetVote()
              goToSelection()
            }}
          />
        )}
        {step === 'selection' && (
          <SelectionStep
            variant={variant}
            selectedListId={selectedListId}
            specialVote={specialVote}
            candidateSelections={candidateSelections}
            canContinue={canContinueSelection}
            lists={lists}
            roles={roles}
            candidates={candidates}
            onSpecialVote={handleSpecialVote}
            onSelectList={handleSelectList}
            onSelectCandidate={(roleId, candidateId) => {
              setSpecialVote(null)
              setCandidateSelections((current) => {
                return {
                  ...current,
                  [roleId]: [candidateId],
                }
              })
            }}
            onContinue={() => setStep('review')}
          />
        )}
        {step === 'review' && (
          <ReviewStep
            variant={variant}
            selectedList={selectedList}
            selectedCandidates={selectedCandidates}
            specialVote={specialVote}
            roles={roles}
            candidates={candidates}
            signingError={signingError}
            isSigning={isSigning}
            onBack={goToSelection}
            onSign={() => {
              void handleSignVote()
            }}
          />
        )}
        {step === 'success' && (
          <SuccessStep
            signedVote={signedVote}
            hasMerkleProof={Boolean(merkleProofData)}
            onLogout={handleLogout}
            onModify={() => {
              resetVote()
              goToSelection()
            }}
          />
        )}
      </div>
    </BudWizardShell>
  )
}

const BudWizardShell = ({
  children,
  step,
}: {
  children: ReactNode
  step: WizardStep
}) => (
  <main className='votar-light-surface relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'>
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
    <section className='relative mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8'>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-3xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
            VOTAR
          </p>
          <p className='mt-2 text-sm text-slate-600'>Boleta Única Digital</p>
        </div>
        <Badge
          variant='outline'
          className='rounded-full border-[#2f6f9f]/30 bg-white/80 px-3 py-1 text-[#2f6f9f]'
        >
          <ShieldCheck className='size-3.5' />
          {getStepLabel(step)}
        </Badge>
      </header>
      {children}
    </section>
  </main>
)

const WizardStepper = ({ currentStep }: { currentStep: WizardStep }) => {
  const steps = [
    ['identity', 'Identidad'],
    ['selection', 'Voto'],
    ['review', 'Confirmación'],
    ['success', 'Éxito'],
  ] as const
  const activeIndex = steps.findIndex(([step]) =>
    currentStep === 'registered' ? step === 'identity' : step === currentStep
  )
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

      <div className='hidden overflow-hidden rounded-2xl sm:flex'>
        {steps.map(([step, label], index) => (
          <div
            key={step}
            className={cn(
              'relative -ms-3 flex min-h-16 flex-1 items-center gap-2 border-r border-[#edf1f4] px-4 py-3 text-sm font-semibold transition-all first:ms-0 last:border-r-0',
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
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const IdentityStep = ({
  boleta,
  returningVoter,
  identityError,
  cryptoReady,
  isLoadingProof,
  onReturningVoterChange,
  onConfirm,
}: {
  boleta: BoletaDigital
  returningVoter: boolean
  identityError: string | null
  cryptoReady: boolean
  isLoadingProof: boolean
  onReturningVoterChange: (value: boolean) => void
  onConfirm: () => void
}) => (
  <div className='mx-auto grid w-full max-w-3xl gap-5'>
    <Card className='border-[#e4e7eb] bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
      <CardHeader className='text-center'>
        <div className='mx-auto grid size-14 place-items-center rounded-full bg-[#d7e9f7] text-[#2f6f9f]'>
          <UserRoundCheck className='size-7' />
        </div>
        <CardTitle className='text-2xl'>Confirmar Identidad</CardTitle>
        <CardDescription>
          Verificá que tus datos sean correctos antes de abrir la boleta.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {cryptoReady ? (
          <div
            className='flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800'
            role='status'
            aria-label='Identidad criptográfica efímera generada'
          >
            <Fingerprint className='size-4' aria-hidden='true' />
            Identidad criptográfica efímera generada
          </div>
        ) : null}
        <div className='grid gap-3 rounded-2xl bg-[#f7fbfd] p-4 sm:grid-cols-2'>
          <IdentityItem label='Sesión' value='Votante autenticado' />
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
          <AlertTitle>Validación obligatoria</AlertTitle>
          <AlertDescription>
            La confirmación de identidad habilita una sesión de votación única.
            Revisá tus datos con atención: luego la boleta se desvincula de tu
            identidad para preservar el secreto del voto.
          </AlertDescription>
        </Alert>
        {identityError && (
          <Alert variant='destructive'>
            <AlertTriangle className='size-4' />
            <AlertTitle>No se pudo validar el padrón</AlertTitle>
            <AlertDescription>{identityError}</AlertDescription>
          </Alert>
        )}
        <div className='rounded-2xl border border-dashed border-[#2f6f9f]/30 bg-white p-3'>
          <p className='mb-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
            Simulación temporal
          </p>
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button
              type='button'
              variant={!returningVoter ? 'default' : 'outline'}
              className={cn(
                !returningVoter && 'bg-[#2f6f9f] hover:bg-[#285f88]'
              )}
              onClick={() => onReturningVoterChange(false)}
            >
              Usuario nuevo
            </Button>
            <Button
              type='button'
              variant={returningVoter ? 'default' : 'outline'}
              className={cn(
                returningVoter && 'bg-[#2f6f9f] hover:bg-[#285f88]'
              )}
              onClick={() => onReturningVoterChange(true)}
            >
              Usuario que ya votó
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          size='lg'
          className='h-12 w-full rounded-xl bg-[#2f6f9f] text-base font-semibold hover:bg-[#285f88]'
          disabled={isLoadingProof}
          onClick={onConfirm}
        >
          {isLoadingProof ? (
            <>
              <Loader2 className='size-5 animate-spin' />
              Obteniendo prueba Merkle...
            </>
          ) : (
            <>
              Confirmar Identidad y Comenzar
              <ArrowRight className='size-5' />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  </div>
)

const RegisteredVoteStep = ({
  onLogout,
  onModify,
}: {
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
            Detectamos una emisión previa asociada a esta sesión electoral.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-2xl bg-amber-50 p-4 text-sm text-amber-950'>
          <span className='font-semibold'>Fecha/hora del voto anterior:</span>{' '}
          {PREVIOUS_VOTE_DATE}
        </div>
      </CardContent>
      <CardFooter className='grid gap-3 sm:grid-cols-2'>
        <Button variant='outline' size='lg' className='h-12' onClick={onLogout}>
          <LogOut className='size-4' />
          Cerrar sesión
        </Button>
        <Button
          size='lg'
          className='h-12 bg-[#2f6f9f] hover:bg-[#285f88]'
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
  lists,
  roles,
  candidates,
  onSpecialVote,
  onSelectList,
  onSelectCandidate,
  onContinue,
}: {
  variant: VotingVariant
  selectedListId: string | null
  specialVote: SpecialVote
  candidateSelections: Record<string, string[]>
  canContinue: boolean
  lists: PartyList[]
  roles: CandidateRole[]
  candidates: Candidate[]
  onSpecialVote: (value: Exclude<SpecialVote, null>) => void
  onSelectList: (listId: string | null) => void
  onSelectCandidate: (roleId: string, candidateId: string) => void
  onContinue: () => void
}) => (
  <div className='grid gap-5'>
    {(variant === 'lista-completa' || variant === 'mixto') && (
      <Card className='border-[#e4e7eb] bg-white/95'>
        <CardHeader>
          <CardTitle>
            {variant === 'mixto' ? 'Boleta completa' : 'Listas completas'}
          </CardTitle>
          <CardDescription>
            Elegí una lista para tomar toda la boleta como base.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
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
        </CardContent>
      </Card>
    )}

    {(!specialVote || variant === 'mixto') &&
      (variant === 'candidatos' || variant === 'mixto') && (
        <Card className='border-[#e4e7eb] bg-white/95'>
          <CardHeader>
            <CardTitle>
              {variant === 'mixto' ? 'Corte de boleta' : 'Candidatos por rol'}
            </CardTitle>
            <CardDescription>
              Elegí un candidato por cargo. Podés combinar partidos diferentes
              entre cargos.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-5'>
            {roles.map((role) => (
              <CandidateRoleSection
                key={role.id}
                roleId={role.id}
                roleName={role.name}
                candidates={candidates}
                selectedCandidateIds={candidateSelections[role.id] ?? []}
                groupByParty={variant === 'candidatos'}
                onSelectCandidate={onSelectCandidate}
              />
            ))}
          </CardContent>
        </Card>
      )}

    <Card className='border-[#e4e7eb] bg-white/95'>
      <CardHeader>
        <CardTitle>Opciones especiales</CardTitle>
        <CardDescription>
          También podés emitir tu voto en blanco o anularlo.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 md:grid-cols-2'>
        <SpecialVoteCard
          title='Votar en blanco'
          description='No selecciona listas ni candidatos.'
          icon={<Circle className='size-20' />}
          selected={specialVote === 'blank'}
          onSelect={() => onSpecialVote('blank')}
        />
        <SpecialVoteCard
          title='Anular voto'
          description='Registra una boleta anulada para este comicio.'
          icon={<Ban className='size-20' />}
          selected={specialVote === 'null'}
          onSelect={() => onSpecialVote('null')}
        />
      </CardContent>
    </Card>

    <div className='sticky bottom-4 z-10 flex justify-end'>
      <Button
        size='lg'
        className='h-12 rounded-xl bg-[#2f6f9f] px-8 font-semibold shadow-lg shadow-slate-900/10 hover:bg-[#285f88]'
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continuar
        <ArrowRight className='size-5' />
      </Button>
    </div>
  </div>
)

const ReviewStep = ({
  variant,
  selectedList,
  selectedCandidates,
  specialVote,
  roles,
  candidates,
  signingError,
  isSigning,
  onBack,
  onSign,
}: {
  variant: VotingVariant
  selectedList?: PartyList
  selectedCandidates: Candidate[]
  specialVote: SpecialVote
  roles: CandidateRole[]
  candidates: Candidate[]
  signingError: string | null
  isSigning: boolean
  onBack: () => void
  onSign: () => void
}) => (
  <div className='mx-auto grid w-full max-w-4xl gap-5'>
    <Card className='border-[#e4e7eb] bg-white/95 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
      <CardHeader>
        <CardTitle>Confirmar Voto</CardTitle>
        <CardDescription>
          Revisá el resumen antes de firmar la boleta de forma local.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {specialVote && <SpecialVoteSummary specialVote={specialVote} />}

        {selectedList && variant !== 'mixto' && (
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

        {!specialVote &&
          (variant === 'candidatos' ||
            variant === 'mixto' ||
            selectedCandidates.length > 0) && (
            <div className='overflow-hidden rounded-2xl border border-[#dbe3ea]'>
              <div className='bg-[#f7fbfd] px-4 py-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
                Candidatos por rol
              </div>
              <div className='divide-y'>
                {selectedCandidates.map((candidate) => (
                  <div key={candidate.id} className='px-4 py-3'>
                    <CandidateReviewItem candidate={candidate} />
                  </div>
                ))}
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
          className='h-12 bg-[#2f6f9f] font-semibold hover:bg-[#285f88]'
          disabled={isSigning}
          onClick={onSign}
          aria-label='Firmar y confirmar voto'
        >
          {isSigning ? (
            <>
              <Loader2 className='size-5 animate-spin' />
              Firmando voto...
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

const SuccessStep = ({
  signedVote,
  hasMerkleProof,
  onLogout,
  onModify,
}: {
  signedVote: SignedVotePayload | null
  hasMerkleProof: boolean
  onLogout: () => void
  onModify: () => void
}) => (
  <div className='mx-auto grid w-full max-w-2xl gap-5'>
    <Card className='border-[#d7eadf] bg-white/95 text-center shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)]'>
      <CardHeader>
        <div className='mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700'>
          <CheckCircle2 className='size-9' />
        </div>
        <CardTitle className='text-2xl'>Voto Exitoso</CardTitle>
        <CardDescription>Su voto ha sido firmado con éxito.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 text-left'>
        {signedVote && (
          <div className='rounded-2xl bg-slate-50 p-4'>
            <p className='mb-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase'>
              Comprobante criptográfico
            </p>
            <p className='text-sm text-slate-700'>
              Tu boleta quedó protegida con firma digital local. Cualquier
              alteración posterior invalidará el sufragio.
            </p>
            {hasMerkleProof && (
              <p className='mt-2 text-sm text-slate-600'>
                Pertenencia al padrón verificada.
              </p>
            )}
            <p className='mt-3 text-sm text-slate-500'>
              El registro en blockchain se completará al confirmar el envío.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className='grid gap-3'>
        <Button
          variant='outline'
          size='lg'
          className='h-12 w-full'
          onClick={onModify}
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
    className={cn(
      'relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none',
      selected
        ? 'border-[#2f6f9f] shadow-md shadow-[#2f6f9f]/10'
        : 'border-[#dbe3ea]'
    )}
    onClick={onSelect}
  >
    <span className='pointer-events-none absolute -right-3 -bottom-5 text-[#2f6f9f]/10'>
      {icon}
    </span>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='font-semibold'>{title}</p>
        <p className='mt-1 text-sm text-slate-500'>{description}</p>
      </div>
      {selected && (
        <span className='grid size-7 shrink-0 place-items-center rounded-full bg-[#2f6f9f] text-white'>
          <Check className='size-4' />
        </span>
      )}
    </div>
  </button>
)

const SpecialVoteSummary = ({ specialVote }: { specialVote: SpecialVote }) => {
  const isBlankVote = specialVote === 'blank'

  return (
    <div className='relative overflow-hidden rounded-2xl border border-[#2f6f9f] bg-white p-5 shadow-md shadow-[#2f6f9f]/10'>
      <span className='pointer-events-none absolute -right-3 -bottom-5 text-[#2f6f9f]/10'>
        {isBlankVote ? (
          <Circle className='size-24' />
        ) : (
          <Ban className='size-24' />
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
        'overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg',
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
              <div>
                <p className='text-lg font-bold'>{list.name}</p>
                <p className='mt-1 text-sm text-slate-500'>
                  Lista {list.initials}
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
  const primaryCandidates = roles
    .map((role) =>
      listCandidates.find((candidate) => candidate.roleId === role.id)
    )
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .slice(0, 2)
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
    <div className={cn(showPrimary && 'mt-4')}>
      {showPrimary && (
        <div className='grid gap-3 md:grid-cols-2'>
          {primaryCandidates.map((candidate) => (
            <CandidatePreview key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}

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
                  <div className='grid gap-2 md:grid-cols-2'>
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
    <CandidateAvatar candidate={candidate} className='size-11 rounded-xl' />
    <div className='min-w-0'>
      <p className='truncate text-sm font-semibold'>{candidate.name}</p>
      <p className='truncate text-xs text-slate-500'>{candidate.role}</p>
    </div>
  </div>
)

const CandidateRoleSection = ({
  roleId,
  roleName,
  candidates,
  selectedCandidateIds,
  groupByParty,
  onSelectCandidate,
}: {
  roleId: string
  roleName: string
  candidates: Candidate[]
  selectedCandidateIds: string[]
  groupByParty: boolean
  onSelectCandidate: (roleId: string, candidateId: string) => void
}) => {
  const roleCandidates = candidates.filter(
    (candidate) => candidate.roleId === roleId
  )
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
  const groupsContent = (
    <div className='grid gap-4'>
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
            <div className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
              <ListLogo
                list={group}
                className='size-9 rounded-xl'
                fallbackClassName='text-xs'
              />
              {group.name}
            </div>
          )}
          <div className='grid gap-3 md:grid-cols-3'>
            {group.candidates.map((candidate) => {
              const isSelected = selectedCandidateIds.includes(candidate.id)
              const accessibleName = `${candidate.name}, ${candidate.listName}, lista ${candidate.numeroLista}`

              return (
                <button
                  key={candidate.id}
                  type='button'
                  aria-pressed={isSelected}
                  aria-label={accessibleName}
                  className={cn(
                    'rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none',
                    isSelected
                      ? 'border-[#2f6f9f] shadow-md shadow-[#2f6f9f]/10'
                      : 'border-[#dbe3ea]'
                  )}
                  onClick={() => onSelectCandidate(roleId, candidate.id)}
                >
                  <div className='flex items-center gap-3'>
                    <CandidateAvatar candidate={candidate} />
                    <div>
                      <p className='font-semibold'>{candidate.name}</p>
                      <p className='text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase'>
                        Lista {candidate.numeroLista}
                      </p>
                      <p className='text-sm text-slate-500'>
                        {candidate.listName}
                      </p>
                    </div>
                    {isSelected && (
                      <span className='ms-auto grid size-7 place-items-center rounded-full bg-[#2f6f9f] text-white'>
                        <Check className='size-4' />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className='grid gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-semibold'>{roleName}</h3>
        <Badge variant='outline'>
          {selectedCandidateIds.length > 0
            ? '1 seleccionado'
            : 'Elegí un candidato'}
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
  <div className='flex items-center gap-3 rounded-2xl bg-white text-sm'>
    <ListLogo
      list={{
        name: candidate.listName,
        initials: candidate.listInitials,
        color: candidate.color,
        accent: getSoftAccent(candidate.color),
        imageUrl: candidate.listImageUrl,
      }}
      className='size-14 rounded-2xl'
    />
    <CandidateAvatar candidate={candidate} className='size-14 rounded-2xl' />
    <div className='min-w-0'>
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
  if (step === 'registered') return 'Voto registrado'
  if (step === 'identity') return 'Confirmación de identidad'
  if (step === 'selection') return 'Selección de voto'
  if (step === 'review') return 'Confirmación'
  return 'Voto exitoso'
}
