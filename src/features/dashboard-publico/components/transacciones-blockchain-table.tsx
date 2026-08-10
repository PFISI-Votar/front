import { ExternalLink } from 'lucide-react'
import type { TransaccionBlockchainPublica } from '@/features/dashboard-publico/api/transacciones-publica-api'

type TransaccionesBlockchainTableProps = {
  transacciones: TransaccionBlockchainPublica[]
  red: string
}

const formatMarcaTiempo = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

const truncateHash = (hash: string): string =>
  hash.length <= 14 ? hash : `${hash.slice(0, 10)}…${hash.slice(-6)}`

export const TransaccionesBlockchainTable = ({
  transacciones,
  red,
}: TransaccionesBlockchainTableProps) => {
  if (transacciones.length === 0) {
    return (
      <div className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-10 text-center shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'>
        <p className='text-sm text-[#5f6368]'>
          Aún no se registraron transacciones on-chain para este comicio.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-[#e4e7eb] bg-white/95 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-left text-sm'>
          <caption className='sr-only'>
            Historial de transacciones blockchain del comicio en {red}, de más
            recientes a más antiguas
          </caption>
          <thead className='border-b border-[#e4e7eb] bg-[#f8fafc] text-xs tracking-wide text-[#5f6368] uppercase'>
            <tr>
              <th scope='col' className='px-4 py-3 font-semibold'>
                Marca de tiempo
              </th>
              <th scope='col' className='px-4 py-3 font-semibold'>
                Bloque
              </th>
              <th scope='col' className='px-4 py-3 font-semibold'>
                Evento
              </th>
              <th scope='col' className='px-4 py-3 font-semibold'>
                Hash
              </th>
              <th scope='col' className='px-4 py-3 font-semibold'>
                <span className='sr-only'>Explorador</span>
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-[#e4e7eb]'>
            {transacciones.map((tx) => (
              <tr key={tx.hashTransaccion} className='text-[#202124]'>
                <td className='px-4 py-3 whitespace-nowrap text-[#5f6368]'>
                  {formatMarcaTiempo(tx.marcaTiempo)}
                </td>
                <td className='px-4 py-3 font-mono text-xs whitespace-nowrap'>
                  #{tx.numeroBloque.toLocaleString('es-AR')}
                </td>
                <td className='px-4 py-3'>
                  <p className='font-medium'>{tx.descripcionLegible}</p>
                  <p className='mt-0.5 text-xs text-[#80868b]'>
                    {tx.contratoEtiqueta} · {tx.nombreEvento}
                  </p>
                </td>
                <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-[#5f6368]'>
                  {truncateHash(tx.hashTransaccion)}
                </td>
                <td className='px-4 py-3 whitespace-nowrap'>
                  <a
                    href={tx.explorerUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#2f6f9f] transition-colors hover:bg-[#2f6f9f]/10'
                    aria-label={`Ver transacción ${truncateHash(tx.hashTransaccion)} en ${red}`}
                  >
                    {red}
                    <ExternalLink className='size-3.5' aria-hidden='true' />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
