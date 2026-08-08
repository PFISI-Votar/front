import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ContratoDireccionPublica } from '@/features/dashboard-publico/api/contrato-estado-publica-api'
import {
  getEstadoEleccionBadgeClass,
  getEstadoEleccionLabel,
} from '@/features/dashboard-publico/lib/estado-eleccion'

type ContratoDireccionRowProps = {
  label: string
  contrato: ContratoDireccionPublica
}

const ContratoDireccionRow = ({
  label,
  contrato,
}: ContratoDireccionRowProps) => (
  <div className='rounded-xl border border-[#e4e7eb] bg-[#fafbfc] px-4 py-3'>
    <p className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
      {label}
    </p>
    <div className='mt-2 flex flex-wrap items-center gap-2'>
      <code className='text-sm break-all text-[#202124]'>
        {contrato.direccion}
      </code>
      <a
        href={contrato.explorerUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1 rounded-md bg-[#2f6f9f]/10 px-2 py-1 text-xs font-medium text-[#2f6f9f] hover:bg-[#2f6f9f]/15'
      >
        Etherscan
        <ExternalLink className='size-3' aria-hidden='true' />
      </a>
    </div>
  </div>
)

type ContratoEstadoTecnicoPanelProps = {
  red: string
  chainId: number
  estadoOnChain: {
    codigo: number
    etiqueta: string
  }
  merkleRoot: {
    hash: string
    publicado: boolean
    publicadoEn: string | null
  }
  revoto: {
    habilitado: boolean
    maxVotosPorVotante: number
    minIntervaloSegundos: number
    politicaRevoto: 'LAST_VOTE_WINS' | 'DISABLED'
  }
  contratos: {
    ballot: ContratoDireccionPublica
    voteRegistry: ContratoDireccionPublica
    auditView: ContratoDireccionPublica
    merkleRootStore: ContratoDireccionPublica
  }
  fuenteDatos: string
}

export const ContratoEstadoTecnicoPanel = ({
  red,
  chainId,
  estadoOnChain,
  merkleRoot,
  revoto,
  contratos,
  fuenteDatos,
}: ContratoEstadoTecnicoPanelProps) => (
  <Card className='gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'>
    <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
      <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
        Ficha técnica del smart contract
      </CardTitle>
      <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
        Variables de configuración vigentes cargadas on-chain. Podés comparar la
        raíz Merkle con la compilación offline del padrón (UAT-02).
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-6 px-6 pb-6 sm:px-8'>
      <div className='flex flex-wrap items-center gap-3'>
        <p className='text-sm text-[#5f6368]'>
          Red:{' '}
          <span className='font-medium text-[#202124]'>
            {red} (chainId {chainId})
          </span>
        </p>
        <p
          className={cn(
            'inline-flex rounded-full px-3 py-1 text-sm font-semibold tracking-wide uppercase',
            getEstadoEleccionBadgeClass(estadoOnChain.etiqueta)
          )}
        >
          On-chain: {getEstadoEleccionLabel(estadoOnChain.etiqueta)}
        </p>
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-[#202124]'>Raíz Merkle</h3>
        <div className='rounded-xl border border-[#e4e7eb] bg-[#fafbfc] px-4 py-3'>
          <p className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
            Hash del padrón
          </p>
          <code className='mt-2 block text-sm break-all text-[#202124]'>
            {merkleRoot.hash}
          </code>
          <p className='mt-2 text-sm text-[#5f6368]'>
            {merkleRoot.publicado
              ? `Publicado on-chain${merkleRoot.publicadoEn ? ` el ${new Date(merkleRoot.publicadoEn).toLocaleString('es-AR')}` : ''}.`
              : 'Aún no publicado on-chain.'}
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-[#202124]'>
          Límites de re-voto
        </h3>
        <dl className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-xl border border-[#e4e7eb] bg-[#fafbfc] px-4 py-3'>
            <dt className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
              Habilitado
            </dt>
            <dd className='mt-1 text-sm font-medium text-[#202124]'>
              {revoto.habilitado ? 'Sí' : 'No'}
            </dd>
          </div>
          <div className='rounded-xl border border-[#e4e7eb] bg-[#fafbfc] px-4 py-3'>
            <dt className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
              Máx. votos
            </dt>
            <dd className='mt-1 text-sm font-medium text-[#202124]'>
              {revoto.maxVotosPorVotante}
            </dd>
          </div>
          <div className='rounded-xl border border-[#e4e7eb] bg-[#fafbfc] px-4 py-3'>
            <dt className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
              Intervalo mín.
            </dt>
            <dd className='mt-1 text-sm font-medium text-[#202124]'>
              {revoto.minIntervaloSegundos}s
            </dd>
          </div>
        </dl>
        <p className='text-sm text-[#5f6368]'>
          Política:{' '}
          <span className='font-medium text-[#202124]'>
            {revoto.politicaRevoto === 'LAST_VOTE_WINS'
              ? 'Último voto válido'
              : 'Deshabilitado'}
          </span>
        </p>
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-[#202124]'>
          Direcciones verificadas
        </h3>
        <div className='grid gap-3'>
          <ContratoDireccionRow
            label='BallotContract'
            contrato={contratos.ballot}
          />
          <ContratoDireccionRow
            label='VoteRegistry'
            contrato={contratos.voteRegistry}
          />
          <ContratoDireccionRow
            label='AuditViewContract'
            contrato={contratos.auditView}
          />
          <ContratoDireccionRow
            label='MerkleRootStore'
            contrato={contratos.merkleRootStore}
          />
        </div>
      </div>

      <p className='text-xs text-[#80868b]'>Fuente: {fuenteDatos}</p>
    </CardContent>
  </Card>
)
