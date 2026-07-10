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

export type SignVotePayloadOptions = {
  /** Opaque nullifier from VOTAR-353 (required). */
  nullifier: Hex
  timestamp?: number
  chainId?: number
  verifyingContract?: Address
}

const isBytes32Hex = (value: string): value is Hex =>
  /^0x[0-9a-fA-F]{64}$/.test(value)

export const buildVoteTypedDataDomain = (
  verifyingContract: Address,
  chainId = getChainId()
): TypedDataDomain => ({
  name: VOTE_EIP712_DOMAIN_NAME,
  version: VOTE_EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract,
})

/**
 * Signs the EIP-712 Vote payload. The nullifier must be supplied by VOTAR-353;
 * this module only includes it in the typed data and signs.
 */
export const signVotePayload = async (
  account: PrivateKeyAccount,
  electionId: number,
  selection: SelectionPayload,
  options: SignVotePayloadOptions
): Promise<SignedVotePayload> => {
  if (!isBytes32Hex(options.nullifier)) {
    throw new Error(
      'nullifier must be a 32-byte hex value provided by VOTAR-353'
    )
  }

  const verifyingContract =
    options.verifyingContract ?? getBallotContractAddress()
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const selectionHash = computeSelectionHash(selection)
  const chainId = options.chainId ?? getChainId()
  const { nullifier } = options

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
