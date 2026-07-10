/**
 * Public session metadata for an ephemeral ECC wallet.
 * Never includes the private key.
 */
export type EphemeralWalletSession = {
  readonly idEleccion: number
  readonly publicKeyHex: string
  readonly createdAt: number
}

export type EphemeralWalletManager = {
  initialize: (idEleccion: number) => Promise<EphemeralWalletSession>
  getSession: () => EphemeralWalletSession | null
  getPublicKeyHex: () => string | null
  destroy: () => void
}
