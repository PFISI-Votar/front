import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import { useEphemeralWallet } from '@/features/voto/crypto/use-ephemeral-wallet'

const wrapper = ({ children }: { children: ReactNode }) => (
  <EphemeralWalletProvider>{children}</EphemeralWalletProvider>
)

describe('EphemeralWalletProvider (VOTAR-418)', () => {
  it('sets isReady to false after a successful signVotePayload', async () => {
    const { result, act } = await renderHook(() => useEphemeralWallet(), {
      wrapper,
    })

    await act(() => result.current.initialize(418, 'voter-scope-a'))

    expect(result.current.isReady).toBe(true)
    expect(result.current.publicKeyHex).toMatch(/^0x0[23][0-9a-f]{64}$/)

    const nullifier =
      '0x5555555555555555555555555555555555555555555555555555555555555555' as const
    const ballotContractAddress =
      '0x0000000000000000000000000000000000000001' as const

    await act(() =>
      result.current.signVotePayload(
        { selecciones: [{ idCategoria: 1, idCandidato: 101 }] },
        nullifier,
        ballotContractAddress
      )
    )

    expect(result.current.isReady).toBe(false)
    expect(result.current.publicKeyHex).toBeNull()
    expect(result.current.session).toBeNull()
  })
})
