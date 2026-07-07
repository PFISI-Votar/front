export const VOTE_EIP712_DOMAIN_NAME = 'VOTAR' as const
export const VOTE_EIP712_DOMAIN_VERSION = '1' as const

export const VOTE_EIP712_TYPES = {
  Vote: [
    { name: 'electionId', type: 'uint256' },
    { name: 'nullifier', type: 'bytes32' },
    { name: 'selectionHash', type: 'bytes32' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const

const DEV_BALLOT_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000001' as const

export const getBallotContractAddress = (): `0x${string}` => {
  const value = import.meta.env.VITE_BALLOT_CONTRACT_ADDRESS
  if (value && /^0x[0-9a-fA-F]{40}$/.test(value)) {
    return value as `0x${string}`
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return DEV_BALLOT_CONTRACT_ADDRESS
  }
  throw new Error(
    'VITE_BALLOT_CONTRACT_ADDRESS no está configurada para firmar el voto'
  )
}

export const getChainId = (): number => {
  const raw = import.meta.env.VITE_CHAIN_ID
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 31_337
}
