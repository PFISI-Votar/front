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
 */
export const createVotePublicClient = (
  rpcUrl = getRpcUrl(),
  chainId = getChainId()
): VotePublicClient =>
  createPublicClient({
    chain: resolveChain(chainId),
    transport: http(rpcUrl),
  })

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
