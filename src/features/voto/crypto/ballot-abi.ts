/**
 * Minimal BallotContract ABI for VOTAR-358 castSignedVote transmission.
 * Must stay aligned with blockchain/contracts/ballot/BallotContract.sol.
 * VOTAR-346 adds candidateId for VoteRegistry audit VoteCast emission.
 * VOTAR-341 replaces NullifierAlreadyUsed with RevoteDisabled when revote is off.
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
    name: 'InvalidSignature',
    inputs: [],
  },
] as const
