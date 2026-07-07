import type { PrivateKeyAccount } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export type EphemeralWallet = {
  account: PrivateKeyAccount
  destroy: () => void
}

export const createEphemeralWallet = (): EphemeralWallet => {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  return {
    account,
    destroy() {
      // Private key lives only in the account closure; dropping references
      // allows GC to reclaim the signing material (UAT-04).
    },
  }
}
