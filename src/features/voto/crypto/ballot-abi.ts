/**
 * Minimal BallotContract ABI for VOTAR-358 castSignedVote transmission.
 * Must stay aligned with blockchain/contracts/ballot/BallotContract.sol.
 * VOTAR-346 adds candidateId for VoteRegistry audit VoteCast emission.
 * VOTAR-341: RevoteDisabled is the current double-vote error when revote is off.
 * VOTAR-451: AlreadyVoted rejects a fresh nullifier after the leaf already voted
 * (tab close / ephemeral key rotation must not inflate participation).
 * VOTAR-324: MaxVotesReached fires once a nullifier reaches maxVotesPerVoter signed votes.
 * VOTAR-325: RetryTooSoon fires when a nullifier re-votes before minIntervalSeconds
 * elapsed; getVoterState exposes the node's cooldownRemaining/blockTimestamp so the
 * BUD can anchor its countdown to the network clock instead of the OS clock.
 * NullifierAlreadyUsed is kept so viem can still decode legacy Sepolia deployments.
 */
export const BALLOT_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'castSignedVote',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'voterLeaf', type: 'bytes32' },
      { name: 'merkleProof', type: 'bytes32[]' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'selectionHash', type: 'bytes32' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'expectedSigner', type: 'address' },
      { name: 'signature', type: 'bytes' },
      { name: 'candidateId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isNullifierUsed',
    stateMutability: 'view',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'hasVoted',
    stateMutability: 'view',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'voterLeaf', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getVoterState',
    stateMutability: 'view',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
    ],
    outputs: [
      { name: 'votesUsed', type: 'uint16' },
      { name: 'lastVoteAt', type: 'uint64' },
      { name: 'cooldownRemaining', type: 'uint256' },
      { name: 'blockTimestamp', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'SignedVoteCast',
    inputs: [
      { name: 'electionId', type: 'uint256', indexed: true },
      { name: 'nullifier', type: 'bytes32', indexed: true },
      { name: 'selectionHash', type: 'bytes32', indexed: false },
      { name: 'signer', type: 'address', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'InvalidMerkleProof',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MerkleRootNotPublished',
    inputs: [{ name: 'electionId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'RevoteDisabled',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AlreadyVoted',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullifierAlreadyUsed',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'InvalidSignature',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ElectionClosed',
    inputs: [{ name: 'electionId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'RetryTooSoon',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'remainingSeconds', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'MaxVotesReached',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'maxVotes', type: 'uint16' },
    ],
  },
  // VOTAR-345 — thrown by VoteRegistry.recordVote (called from castSignedVote),
  // so its selector must be decodable from the same revert data.
  {
    type: 'error',
    name: 'InvalidCandidateId',
    inputs: [
      { name: 'electionId', type: 'uint256' },
      { name: 'candidateId', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'CandidateSetNotRegistered',
    inputs: [{ name: 'electionId', type: 'uint256' }],
  },
] as const
