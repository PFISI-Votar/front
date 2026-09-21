import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sanitizeDeployCspOrigin } from './security-headers'

const libPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../deploy/csp-origin-lib.sh'
)

/**
 * Run the same sanitize path as docker-entrypoint (to_csp_origin + production
 * is_allowed_connect_origin). Returns null when shell rejects the value.
 */
const shellSanitizeDeployOrigin = (raw: string): string | null => {
  const script = `
set -eu
. "${libPath}"
origin=$(to_csp_origin "$1") || exit 0
is_allowed_connect_origin "$origin" || exit 0
printf '%s' "$origin"
`
  try {
    const out = execFileSync('sh', ['-c', script, 'sh', raw], {
      encoding: 'utf8',
    }).trim()
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

/**
 * Parity table from PR review: TS sanitizeDeployCspOrigin and shell must agree.
 */
const PARITY_CASES: Array<{ input: string; expected: string | null }> = [
  {
    input: 'https://eth-sepolia.g.alchemy.com/v2/alchemy-secret',
    expected: 'https://eth-sepolia.g.alchemy.com',
  },
  {
    input: 'https://eth.example.com/v2/KEY?ref=a@b',
    expected: 'https://eth.example.com',
  },
  { input: 'HTTPS://api.votar.ar', expected: 'https://api.votar.ar' },
  { input: 'https://host:notaport', expected: null },
  {
    input: 'https://rpc.example.com;frame-ancestorshttps://evil.example',
    expected: null,
  },
  {
    input: 'https://rpc.example.com;frame-ancestors https://evil.example',
    expected: null,
  },
  { input: 'https://rpc.example.com"', expected: null },
  { input: 'http://127.0.0.1:8545', expected: 'http://127.0.0.1:8545' },
  { input: 'http://[::1]:8545', expected: 'http://[::1]:8545' },
  { input: 'http://rpc.public.example:8545', expected: null },
  { input: 'api.votar.ar', expected: null },
]

describe('CSP origin TS ↔ shell parity (VOTAR-489)', () => {
  it.each(PARITY_CASES)('agrees on $input', ({ input, expected }) => {
    expect(sanitizeDeployCspOrigin(input)).toBe(expected)
    expect(shellSanitizeDeployOrigin(input)).toBe(expected)
  })
})
