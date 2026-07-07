import { encodePacked, keccak256, type Address } from 'viem'

/**
 * Derives the per-election nullifier from the ephemeral public key address.
 * NULLIFIER = hash(clavePublica + idEleccion) — lineamientos §7.3.
 */
export const deriveNullifier = (
  publicKeyAddress: Address,
  electionId: number
): `0x${string}` =>
  keccak256(
    encodePacked(['address', 'uint256'], [publicKeyAddress, BigInt(electionId)])
  )
