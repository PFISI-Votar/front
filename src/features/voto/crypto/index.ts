export {
  VOTE_EIP712_DOMAIN_NAME,
  VOTE_EIP712_DOMAIN_VERSION,
  VOTE_EIP712_TYPES,
  VOTE_TX_CONFIRMATION_TIMEOUT_MS,
  VOTE_TX_GAS_MARGIN,
  VOTE_TX_MAX_ATTEMPTS,
  getBallotContractAddress,
  getChainId,
  getExplorerTxUrl,
  getRpcUrl,
  getRpcUrls,
  getVoteTransmitterPrivateKey,
} from '@/features/voto/crypto/constants'
export { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
export { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
export type {
  EphemeralWalletManager,
  EphemeralWalletSession,
} from '@/features/voto/crypto/ephemeral-wallet.types'
export {
  createVotePublicClient,
  createVoteTransmitterWalletClient,
} from '@/features/voto/crypto/rpc-client'
export {
  buildSelectionPayload,
  computeSelectionHash,
  type SelectionPayload,
} from '@/features/voto/crypto/selection-hash'
export {
  resolveAuditCandidateId,
  VOTO_BLANCO,
  VOTO_NULO,
} from '@/features/voto/crypto/audit-candidate-id'
export {
  assembleSignedVotePayload,
  buildVoteTypedDataDomain,
  buildVoteTypedDataMessage,
  hashVoteTypedData,
  signVotePayload,
  signVotePayloadWithDigestSigner,
  type SignedVotePayload,
  type SignVotePayloadOptions,
  type SignVotePayloadWithDigestSignerOptions,
} from '@/features/voto/crypto/vote-signer'
export { signDigestWithSecp256k1 } from '@/features/voto/crypto/secp256k1-digest-signer'
export {
  transmitSignedVote,
  waitForVoteTxReceipt,
  type TransmitProgressPhase,
  type TransmitSignedVoteInput,
  type TransmitSignedVoteOptions,
  type TransmitSignedVoteResult,
  type WaitForVoteTxReceiptOptions,
} from '@/features/voto/crypto/vote-transmitter'
export {
  clearPendingVoteCast,
  loadPendingVoteCast,
  savePendingVoteCast,
  type PendingVoteCast,
} from '@/features/voto/crypto/pending-vote-cast'
export {
  logVoteTxError,
  type VoteTxErrorLogContext,
} from '@/features/voto/crypto/log-vote-tx-error'
export {
  getRevertErrorData,
  mapVoteTxError,
  type RevertErrorData,
  type VoteTxError,
  type VoteTxErrorCode,
} from '@/features/voto/crypto/vote-tx-errors'
export {
  VOTE_TX_FALLBACK_MESSAGE,
  VOTE_TX_MESSAGES,
} from '@/features/voto/crypto/vote-tx-error-catalog'
export {
  buildInclusionSuccessMessage,
  getBlockchainNetworkName,
  verificarInclusionVotoLocal,
  VoteInclusionInvalidHashError,
  VoteInclusionNotFoundError,
  VOTO_NO_ENCONTRADO_MENSAJE,
  type VerificarInclusionVotoOptions,
  type VoteInclusionResult,
} from '@/features/voto/crypto/verificar-voto-inclusion'
export {
  computeRemainingSeconds,
  loadPersistedCooldownAnchor,
  mergeCooldownAnchor,
  persistCooldownAnchor,
  resolveCooldownAnchor,
  type CooldownAnchor,
} from '@/features/voto/crypto/cooldown-clock'
export {
  calcularNullifier,
  CredencialNulificadorInvalidaError,
} from '@/features/voto/crypto/nullifier'
