import { type ReactNode } from 'react'
import budFingerprint from '@/assets/bud-fingerprint.png'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const BACKGROUND_FINGERPRINTS = [
  { top: '8%', left: '12%', width: '7.5rem', opacity: 0.05, rotate: '-18deg' },
  { top: '12%', left: '82%', width: '8rem', opacity: 0.045, rotate: '21deg' },
  { top: '30%', left: '28%', width: '7rem', opacity: 0.04, rotate: '8deg' },
  { top: '38%', left: '72%', width: '8.5rem', opacity: 0.05, rotate: '-26deg' },
  { top: '58%', left: '14%', width: '8rem', opacity: 0.045, rotate: '24deg' },
  { top: '64%', left: '88%', width: '7rem', opacity: 0.04, rotate: '-10deg' },
  { top: '82%', left: '34%', width: '8.75rem', opacity: 0.05, rotate: '-22deg' },
  { top: '88%', left: '70%', width: '7.5rem', opacity: 0.04, rotate: '16deg' },
] as const

export const VotarLoginBackground = () => (
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
)

export const LoginField = ({
  label,
  htmlFor,
  children,
  compact = false,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  compact?: boolean
}) => (
  <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
    <Label
      htmlFor={htmlFor}
      className={cn(
        'font-semibold text-[#4b4f56]',
        compact ? 'text-xs' : 'text-sm',
      )}
    >
      {label}
    </Label>
    <div className='relative'>{children}</div>
  </div>
)
