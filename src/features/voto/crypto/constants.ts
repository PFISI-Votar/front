/**
 * Cross-repo EIP-712 contract for VOTAR-357 / VOTAR-346 (must match BallotContract.sol).
 *
 * Domain: name "VOTAR", version "1", chainId, verifyingContract
 * Type: Vote(uint256 electionId, bytes32 nullifier, bytes32 selectionHash, uint256 candidateId, uint256 timestamp)
 * Nullifier: opaque bytes32 produced by VOTAR-353 (not derived in this module)
 * selectionHash: keccak256(JSON.stringify(normalizedPayload))
 * candidateId: audit id (or reserved blanco/nulo), bound in the digest for tally integrity
 */
export const VOTE_EIP712_DOMAIN_NAME = 'VOTAR' as const
export const VOTE_EIP712_DOMAIN_VERSION = '1' as const

export const VOTE_EIP712_TYPES = {
  Vote: [
    { name: 'electionId', type: 'uint256' },
    { name: 'nullifier', type: 'bytes32' },
    { name: 'selectionHash', type: 'bytes32' },
    { name: 'candidateId', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const

const DEV_BALLOT_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000001' as const

export const getBallotContractAddress = (): `0x${string}` => {
  const value = import.meta.env.VITE_BALLOT_CONTRACT_ADDRESS
  if (value && /^0x[0-9a-fA-F]{40}$/.test(value)) {
    return value as `0x${string}`
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return DEV_BALLOT_CONTRACT_ADDRESS
  }
  throw new Error(
    'VITE_BALLOT_CONTRACT_ADDRESS no está configurada para firmar el voto'
  )
}

export const getChainId = (): number => {
  const raw = import.meta.env.VITE_CHAIN_ID
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 31_337
}

const DEV_RPC_URL = 'http://127.0.0.1:8545'

/**
 * JSON-RPC endpoint for vote transmission (VOTAR-358).
 */
export const getRpcUrl = (): string => {
  const value = import.meta.env.VITE_RPC_URL
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return DEV_RPC_URL
  }
  throw new Error('VITE_RPC_URL no está configurada para transmitir el voto')
}

/**
 * Platform transmitter private key that pays gas for castSignedVote.
 * Testnet/local only — never use a mainnet key in the frontend bundle.
 */
export const getVoteTransmitterPrivateKey = (): `0x${string}` => {
  const value = import.meta.env.VITE_PRIVATE_KEY
  if (value && /^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value as `0x${string}`
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    // Hardhat/Anvil account #0 — local only.
    return '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  }
  throw new Error(
    'VITE_PRIVATE_KEY no está configurada para transmitir el voto'
  )
}

export const getExplorerTxUrl = (
  txHash: `0x${string}`,
  chainId = getChainId()
): string | null => {
  if (chainId === 11_155_111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`
  }
  if (chainId === 1) {
    return `https://etherscan.io/tx/${txHash}`
  }
  return null
}

/** Gas safety margin over estimateContractGas (VOTAR-358). */
export const VOTE_TX_GAS_MARGIN = 1.1

/** Max automatic retries for transient network errors. */
export const VOTE_TX_MAX_ATTEMPTS = 3

/**
 * Default wait-for-receipt timeout in milliseconds.
 * - Development/Local (Hardhat): 30 segundos (bloques instantáneos)
 * - Testnet (Sepolia): 90 segundos (bloques ~12s)
 */
export const VOTE_TX_CONFIRMATION_TIMEOUT_MS =
  import.meta.env.DEV || import.meta.env.MODE === 'test' ? 30_000 : 90_000
