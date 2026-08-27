import { parseRpcUrls } from '@/features/voto/crypto/rpc-failover'

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

const DEV_ELECTION_FACTORY_ADDRESS =
  '0x0000000000000000000000000000000000000002' as const

/**
 * Cada comicio despliega su propio BallotContract vía ElectionFactory
 * (VOTAR-439), por lo que la verificación pública de un recibo no puede
 * validar contra una única dirección fija de BallotContract.
 */
export const getElectionFactoryAddress = (): `0x${string}` => {
  const value = import.meta.env.VITE_ELECTION_FACTORY_ADDRESS
  if (value && /^0x[0-9a-fA-F]{40}$/.test(value)) {
    return value as `0x${string}`
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return DEV_ELECTION_FACTORY_ADDRESS
  }
  throw new Error(
    'VITE_ELECTION_FACTORY_ADDRESS no está configurada para verificar recibos'
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
export const getRpcUrl = (): string => getRpcUrls()[0]

/**
 * Primary + backup RPC endpoints (VOTAR-386).
 * `VITE_RPC_FALLBACK_URLS` is a comma-separated Infura/Alchemy/QuickNode list.
 */
export const getRpcUrls = (): string[] => {
  const urls = parseRpcUrls(
    import.meta.env.VITE_RPC_URL,
    import.meta.env.VITE_RPC_FALLBACK_URLS
  )
  if (urls.length > 0) {
    return urls
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return [DEV_RPC_URL]
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

/** Per-request JSON-RPC timeout so estimate/gas reads cannot hang forever (VOTAR-451). */
export const VOTE_RPC_REQUEST_TIMEOUT_MS = 30_000

/** Axios timeout for voter-scoped API calls during cast finalization (VOTAR-451). */
export const VOTANTE_API_TIMEOUT_MS = 30_000

/**
 * Pending casts older than receipt wait + buffer are discarded on load (VOTAR-451).
 * Avoids auto-resuming a stale txHash that traps the wizard on mount.
 */
export const PENDING_VOTE_CAST_MAX_AGE_MS =
  VOTE_TX_CONFIRMATION_TIMEOUT_MS + 60_000
