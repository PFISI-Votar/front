import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { hardhat, localhost, sepolia } from 'viem/chains'
import {
  getChainId,
  getRpcUrl,
  getVoteTransmitterPrivateKey,
} from '@/features/voto/crypto/constants'

export type VotePublicClient = PublicClient<Transport, Chain>
export type VoteWalletClient = WalletClient<Transport, Chain>

const resolveChain = (chainId: number): Chain => {
  if (chainId === sepolia.id) {
    return sepolia
  }
  if (chainId === hardhat.id) {
    return hardhat
  }
  if (chainId === localhost.id) {
    return localhost
  }
  return {
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl()] },
    },
  }
}

/**
 * Creates a read-only JSON-RPC client for gas estimation and receipt polling.
 * Uses faster polling (1s) in development for instant Hardhat blocks.
 */
export const createVotePublicClient = (
  rpcUrl = getRpcUrl(),
  chainId = getChainId()
): VotePublicClient => {
  const isDev =
    chainId === hardhat.id ||
    chainId === localhost.id ||
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test'

  return createPublicClient({
    chain: resolveChain(chainId),
    transport: http(rpcUrl),
    // Polling más agresivo en desarrollo (1s vs 4s default)
    // para respuesta instantánea con Hardhat
    pollingInterval: isDev ? 1_000 : 4_000,
  })
}

/**
 * Creates a wallet client for the platform transmitter that pays gas.
 */
export const createVoteTransmitterWalletClient = (
  privateKey: Hex = getVoteTransmitterPrivateKey(),
  rpcUrl = getRpcUrl(),
  chainId = getChainId()
): VoteWalletClient => {
  const account = privateKeyToAccount(privateKey)
  return createWalletClient({
    account,
    chain: resolveChain(chainId),
    transport: http(rpcUrl),
  })
}
