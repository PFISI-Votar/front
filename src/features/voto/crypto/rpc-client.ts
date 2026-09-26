import {
  createPublicClient,
  type Chain,
  type PublicClient,
  type Transport,
} from 'viem'
import { hardhat, localhost, sepolia } from 'viem/chains'
import {
  getChainId,
  getRpcUrl,
  getRpcUrls,
} from '@/features/voto/crypto/constants'
import { createVoteRpcTransport } from '@/features/voto/crypto/rpc-failover-transport'

export type VotePublicClient = PublicClient<Transport, Chain>

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
  rpcUrl?: string,
  chainId = getChainId()
): VotePublicClient => {
  const urls = rpcUrl ? [rpcUrl] : getRpcUrls()
  const isDev =
    chainId === hardhat.id ||
    chainId === localhost.id ||
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test'

  return createPublicClient({
    chain: resolveChain(chainId),
    transport: createVoteRpcTransport(urls),
    // Polling más agresivo en desarrollo (1s vs 4s default)
    // para respuesta instantánea con Hardhat
    pollingInterval: isDev ? 1_000 : 4_000,
  })
}
