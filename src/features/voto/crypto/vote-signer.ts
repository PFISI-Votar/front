import {
  type Address,
  type Hex,
  type PrivateKeyAccount,
  type TypedDataDomain,
} from 'viem'
import {
  getBallotContractAddress,
  getChainId,
  VOTE_EIP712_DOMAIN_NAME,
  VOTE_EIP712_DOMAIN_VERSION,
  VOTE_EIP712_TYPES,
} from '@/features/voto/crypto/constants'
import { deriveNullifier } from '@/features/voto/crypto/nullifier'
import {
  computeSelectionHash,
  type SelectionPayload,
} from '@/features/voto/crypto/selection-hash'

export type SignedVotePayload = {
  electionId: number
  nullifier: Hex
  selectionHash: Hex
  timestamp: number
  expectedSigner: Address
  signature: Hex
}

export const buildVoteTypedDataDomain = (
  verifyingContract: Address,
  chainId = getChainId()
): TypedDataDomain => ({
  name: VOTE_EIP712_DOMAIN_NAME,
  version: VOTE_EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract,
})

export const signVotePayload = async (
  account: PrivateKeyAccount,
  electionId: number,
  selection: SelectionPayload,
  options?: {
    timestamp?: number
    chainId?: number
    verifyingContract?: Address
  }
): Promise<SignedVotePayload> => {
  const verifyingContract =
    options?.verifyingContract ?? getBallotContractAddress()

  const timestamp = options?.timestamp ?? Math.floor(Date.now() / 1000)
  const nullifier = deriveNullifier(account.address, electionId)
  const selectionHash = computeSelectionHash(selection)
  const chainId = options?.chainId ?? getChainId()

  const signature = await account.signTypedData({
    domain: buildVoteTypedDataDomain(verifyingContract, chainId),
    types: VOTE_EIP712_TYPES,
    primaryType: 'Vote',
    message: {
      electionId: BigInt(electionId),
      nullifier,
      selectionHash,
      timestamp: BigInt(timestamp),
    },
  })

  return {
    electionId,
    nullifier,
    selectionHash,
    timestamp,
    expectedSigner: account.address,
    signature,
  }
}
