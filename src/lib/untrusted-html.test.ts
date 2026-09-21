import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { toUntrustedPlainText } from './untrusted-html'

const SRC_ROOT = path.resolve(process.cwd(), 'src')

const FORBIDDEN_SINKS = [
  'dangerouslySetInnerHTML',
  'insertAdjacentHTML',
  'document.write',
  'srcdoc',
  '.innerHTML =',
  'eval(',
  'new Function',
]

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      return collectSourceFiles(fullPath)
    }
    if (
      !/\.(ts|tsx)$/.test(entry) ||
      entry.endsWith('.test.ts') ||
      entry.endsWith('.test.tsx')
    ) {
      return []
    }
    return [fullPath]
  })
}

describe('toUntrustedPlainText', () => {
  it('strips angle brackets so nested or unclosed tags cannot reform', () => {
    expect(toUntrustedPlainText('Ana Lopez')).toBe('Ana Lopez')
    expect(toUntrustedPlainText('<script>alert(1)</script>')).toBe(
      'scriptalert(1)/script'
    )
    expect(toUntrustedPlainText('<img src=x onerror=alert(1)>')).toBe(
      'img src=x onerror=alert(1)'
    )
    expect(toUntrustedPlainText('nombre <b>')).toBe('nombre b')
    expect(toUntrustedPlainText('<scr<script>ipt>')).toBe('scrscriptipt')
    expect(toUntrustedPlainText('<script')).not.toMatch(/<script/i)
    expect(toUntrustedPlainText('<scr<script>ipt>')).not.toMatch(/[<>]/)
  })
})

describe('untrusted HTML sinks', () => {
  it('does not render untrusted HTML in BUD or Panel source', () => {
    const offenders: string[] = []

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const source = readFileSync(filePath, 'utf8')
      for (const sink of FORBIDDEN_SINKS) {
        if (source.includes(sink)) {
          offenders.push(`${path.relative(SRC_ROOT, filePath)}: ${sink}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
