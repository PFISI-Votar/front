import {
  type Address,
  type Hex,
  type PrivateKeyAccount,
  type TypedDataDomain,
  hashTypedData,
} from 'viem'
import { resolveAuditCandidateId } from '@/features/voto/crypto/audit-candidate-id'
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
  /** Audit candidate id bound in the EIP-712 digest (VOTAR-346). */
  candidateId: bigint
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

export type VoteTypedDataMessage = {
  electionId: bigint
  nullifier: Hex
  selectionHash: Hex
  candidateId: bigint
  timestamp: bigint
}

export type SignVotePayloadWithDigestSignerOptions = SignVotePayloadOptions & {
  expectedSigner: Address
  signDigest: (digest: Hex) => Promise<Hex>
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

export const buildVoteTypedDataMessage = (
  electionId: number,
  selectionHash: Hex,
  nullifier: Hex,
  candidateId: bigint,
  timestamp: number
): VoteTypedDataMessage => ({
  electionId: BigInt(electionId),
  nullifier,
  selectionHash,
  candidateId,
  timestamp: BigInt(timestamp),
})

export const hashVoteTypedData = (
  electionId: number,
  selectionHash: Hex,
  nullifier: Hex,
  candidateId: bigint,
  timestamp: number,
  options?: Pick<SignVotePayloadOptions, 'chainId' | 'verifyingContract'>
): Hex => {
  const verifyingContract =
    options?.verifyingContract ?? getBallotContractAddress()
  const chainId = options?.chainId ?? getChainId()

  return hashTypedData({
    domain: buildVoteTypedDataDomain(verifyingContract, chainId),
    types: VOTE_EIP712_TYPES,
    primaryType: 'Vote',
    message: buildVoteTypedDataMessage(
      electionId,
      selectionHash,
      nullifier,
      candidateId,
      timestamp
    ),
  })
}

export const assembleSignedVotePayload = (input: {
  electionId: number
  nullifier: Hex
  selectionHash: Hex
  candidateId: bigint
  timestamp: number
  expectedSigner: Address
  signature: Hex
}): SignedVotePayload => ({
  electionId: input.electionId,
  nullifier: input.nullifier,
  selectionHash: input.selectionHash,
  candidateId: input.candidateId,
  timestamp: input.timestamp,
  expectedSigner: input.expectedSigner,
  signature: input.signature,
})

/**
 * Signs the EIP-712 Vote payload via a digest signer callback.
 * Used by the ephemeral wallet so the private key never leaves its Uint8Array buffer.
 * `candidateId` is derived from the selection so the audit id cannot diverge from the signed intent.
 */
export const signVotePayloadWithDigestSigner = async (
  electionId: number,
  selection: SelectionPayload,
  options: SignVotePayloadWithDigestSignerOptions
): Promise<SignedVotePayload> => {
  if (!isBytes32Hex(options.nullifier)) {
    throw new Error(
      'nullifier must be a 32-byte hex value provided by VOTAR-353'
    )
  }

  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const selectionHash = computeSelectionHash(selection)
  const candidateId = resolveAuditCandidateId(selection)
  const digest = hashVoteTypedData(
    electionId,
    selectionHash,
    options.nullifier,
    candidateId,
    timestamp,
    {
      chainId: options.chainId,
      verifyingContract: options.verifyingContract,
    }
  )
  const signature = await options.signDigest(digest)

  return assembleSignedVotePayload({
    electionId,
    nullifier: options.nullifier,
    selectionHash,
    candidateId,
    timestamp,
    expectedSigner: options.expectedSigner,
    signature,
  })
}

/**
 * Signs the EIP-712 Vote payload with a viem account.
 * Kept for unit-test compatibility with the EIP-712 contract; runtime signing
 * goes through {@link signVotePayloadWithDigestSigner}.
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
  const candidateId = resolveAuditCandidateId(selection)
  const chainId = options.chainId ?? getChainId()
  const { nullifier } = options

  const signature = await account.signTypedData({
    domain: buildVoteTypedDataDomain(verifyingContract, chainId),
    types: VOTE_EIP712_TYPES,
    primaryType: 'Vote',
    message: buildVoteTypedDataMessage(
      electionId,
      selectionHash,
      nullifier,
      candidateId,
      timestamp
    ),
  })

  return assembleSignedVotePayload({
    electionId,
    nullifier,
    selectionHash,
    candidateId,
    timestamp,
    expectedSigner: account.address,
    signature,
  })
}
