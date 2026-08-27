import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Fingerprint, Lock, ShieldCheck, Unlink } from 'lucide-react'
import {
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'

const SECTIONS = [
  {
    id: 'resumen',
    title: 'En pocas palabras',
    body: [
      'La Ley 25.326 de Protección de Datos Personales exige minimizar datos sensibles, preservar la confidencialidad y permitir el derecho al olvido. En VOTAR eso se traduce en una regla simple: ningún dato personal en texto claro (nombre, DNI, correo, legajo, etc.) viaja a la blockchain ni queda publicado on-chain.',
      'Lo que sí se registra en la red son representaciones criptográficas de longitud fija (hashes), firmas digitales y nulificadores anónimos. Esas representaciones no se pueden revertir a la identidad original.',
    ],
  },
  {
    id: 'que-nunca-viaja',
    title: 'Qué nunca se envía a la blockchain',
    body: [
      'Antes de armar cualquier transacción de votación o de publicación de padrón, el sistema descarta identidades legibles. En los payloads on-chain no hay nombres de usuario, números de documento, correos electrónicos ni otros identificadores en claro.',
      'El padrón se publica como un árbol de Merkle cuyas hojas son hashes Keccak-256. La auditoría pública ve raíces y pruebas matemáticas de pertenencia, no el padrón nominativo.',
    ],
  },
  {
    id: 'como-se-estructura',
    title: 'Cómo se estructura el payload del voto',
    body: [
      'Cuando emitís un sufragio desde la Boleta Única Digital (BUD), el navegador genera una billetera efímera solo para esa sesión. Con ella se calcula un nullifier (ancla anónima por elección) y se firma el voto con ECDSA.',
      'La transacción incluye, entre otros, la hoja del padrón (hash), la prueba Merkle, el nullifier, el hash de la selección, la firma y un identificador de candidato para el escrutinio. Ninguno de esos campos es un dato personal legible.',
      'Los eventos públicos (por ejemplo SignedVoteCast / VoteCast) exponen anclas anónimas y hashes de longitud fija. El diseño evita unir en la cadena la hoja de identidad con la preferencia electoral de forma que revele a una persona.',
    ],
  },
  {
    id: 'desvinculacion',
    title: 'Desvinculación identidad → voto',
    body: [
      'El voto “nace huérfano” de identidad: no existe una clave foránea que una al votante con su sufragio en la capa on-chain. La elegibilidad se demuestra con Merkle; la unicidad y el recibo usan el nullifier anónimo.',
      'Esa separación estructural sostiene el derecho al olvido y la minimización: aunque el registro electoral sea inmutable, no conserva PII que deba borrarse o censurarse después.',
    ],
  },
  {
    id: 'transito',
    title: 'Tráfico cifrado y canales seguros',
    body: [
      'Las peticiones HTTP hacia el backend y hacia los nodos RPC de la red (p. ej. Sepolia en entornos de prueba) viajan bajo HTTPS/TLS de extremo a extremo en despliegues productivos.',
      'Aunque un analista inspeccione el tráfico descifrado en un entorno controlado, no debería encontrar datos personales estructurados legibles destinados a la blockchain: solo tokens de sesión, hashes y payloads criptográficos.',
    ],
  },
  {
    id: 'auditoria',
    title: 'Qué puede verificar un auditor',
    body: [
      'Un auditor externo puede inspeccionar transacciones y eventos on-chain y corroborar que parámetros y logs contienen hashes de longitud fija e identificadores anónimos, sin fragmentos de texto claro que revelen electores.',
      'También puede usar el verificador público de recibos: confirma la inclusión del sufragio en la urna electrónica sin revelar la opción elegida ni la identidad del votante.',
    ],
  },
] as const

/**
 * VOTAR-378 — Página pública de cumplimiento Ley 25.326 (PII / privacidad on-chain).
 * Accesible desde BUD y Dashboard público.
 */
export const Ley25326Page = () => (
  <main
    className={`relative min-h-svh overflow-hidden bg-[#fdfcfa] ${VOTAR_LIGHT_SURFACE_CLASS}`}
  >
    <VotarLoginBackground />
    <div className='relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14'>
      <div className='mb-8 flex items-center justify-between gap-4'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
        <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
          Cumplimiento normativo
        </p>
      </div>

      <header className='mb-8 space-y-4'>
        <div className='inline-flex items-center gap-1.5 rounded-full border border-[#d0e3f0] bg-[#2f6f9f]/8 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-[#2f6f9f] uppercase'>
          <ShieldCheck className='size-3.5' aria-hidden='true' />
          Ley 25.326
        </div>
        <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
          Protección de datos personales en VOTAR
        </h1>
        <p className='max-w-2xl text-sm leading-relaxed text-[#5f6368] sm:text-base'>
          Explicación simple y detallada de cómo la plataforma garantiza que
          ningún dato personal en texto claro se envíe a la blockchain, en
          cumplimiento del derecho al olvido, la minimización de datos y la
          confidencialidad.
        </p>
      </header>

      <div className='mb-8 grid gap-3 sm:grid-cols-3'>
        <HighlightCard
          icon={<Lock className='size-4' aria-hidden='true' />}
          title='Sin PII on-chain'
          text='Solo hashes, firmas y nulificadores anónimos.'
        />
        <HighlightCard
          icon={<Unlink className='size-4' aria-hidden='true' />}
          title='Identidad desvinculada'
          text='El voto no queda unido a una persona en la cadena.'
        />
        <HighlightCard
          icon={<Fingerprint className='size-4' aria-hidden='true' />}
          title='Auditable'
          text='Se puede inspeccionar la red sin revelar electores.'
        />
      </div>

      <div className='space-y-5'>
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-6 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:px-8'
          >
            <h2 className='text-lg font-bold tracking-tight text-[#202124]'>
              {section.title}
            </h2>
            <div className='mt-3 space-y-3 text-sm leading-relaxed text-[#5f6368]'>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className='mt-10 flex flex-col gap-3 border-t border-[#e4e7eb] pt-6 text-sm text-[#5f6368] sm:flex-row sm:items-center sm:justify-between'>
        <p>
          Referencia técnica del ticket{' '}
          <span className='font-medium text-[#2f6f9f]'>VOTAR-378</span>.
        </p>
        <Link
          to='/verificar'
          className='inline-flex items-center gap-1.5 font-medium text-[#2f6f9f] hover:underline'
        >
          Ir al verificador público
          <ArrowLeft className='size-3.5 rotate-180' aria-hidden='true' />
        </Link>
      </footer>
    </div>
  </main>
)

const HighlightCard = ({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) => (
  <div className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-4 py-4 shadow-[0_0.5rem_1.5rem_rgba(30,64,95,0.06)]'>
    <div className='mb-2 inline-flex rounded-full bg-[#2f6f9f]/10 p-2 text-[#2f6f9f]'>
      {icon}
    </div>
    <p className='text-sm font-semibold text-[#202124]'>{title}</p>
    <p className='mt-1 text-xs leading-relaxed text-[#5f6368]'>{text}</p>
  </div>
)
