/**
 * Minimal ElectionFactory ABI for VOTAR-439 client-side ballot resolution.
 * Each comicio deploys its own BallotContract via ElectionFactory.createElection,
 * so verifying a receipt must resolve the ballot address per electionId instead
 * of comparing against a single fixed contract address.
 * Must stay aligned with blockchain/contracts/factory/ElectionFactory.sol.
 */
export const ELECTION_FACTORY_ABI = [
  {
    type: 'function',
    name: 'getElection',
    stateMutability: 'view',
    inputs: [{ name: 'electionId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'ballot', type: 'address' },
          { name: 'voteRegistry', type: 'address' },
          { name: 'auditView', type: 'address' },
          {
            name: 'revoteConfig',
            type: 'tuple',
            components: [
              { name: 'enabled', type: 'bool' },
              { name: 'maxVotesPerVoter', type: 'uint16' },
              { name: 'minIntervalSeconds', type: 'uint32' },
              { name: 'policy', type: 'uint8' },
            ],
          },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
  },
] as const
