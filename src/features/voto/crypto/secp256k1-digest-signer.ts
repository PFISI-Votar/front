import { hashes, signAsync } from '@noble/secp256k1'
import { type Hex, bytesToHex, hexToBytes, serializeSignature } from 'viem'

const DIGEST_BYTES = 32
const RECOVERED_SIGNATURE_BYTES = 65

/**
 * Ensures noble sync hash slots are wired when callers use sync APIs elsewhere.
 * `signAsync` uses WebCrypto; this keeps the module self-contained for tests.
 */
const ensureNobleHashes = async (): Promise<void> => {
  if (hashes.sha256 && hashes.hmacSha256) {
    return
  }
  const [{ hmac }, { sha256 }] = await Promise.all([
    import('@noble/hashes/hmac.js'),
    import('@noble/hashes/sha2.js'),
  ])
  hashes.sha256 = sha256
  hashes.hmacSha256 = (key, message) => hmac(sha256, key, message)
}

const isBytes32Hex = (value: string): value is Hex =>
  /^0x[0-9a-fA-F]{64}$/.test(value)

/**
 * Signs a 32-byte digest with secp256k1 using the provided private-key buffer.
 * Returns an Ethereum-compatible signature (`0x` + r + s + v).
 *
 * Does not copy the private key to a hex string and does not destroy the buffer;
 * the caller owns zeroization (VOTAR-418).
 */
export const signDigestWithSecp256k1 = async (
  privateKey: Uint8Array,
  digest: Hex
): Promise<Hex> => {
  if (privateKey.length !== DIGEST_BYTES) {
    throw new Error('privateKey must be a 32-byte Uint8Array')
  }
  if (!isBytes32Hex(digest)) {
    throw new Error('digest must be a 32-byte hex value')
  }

  await ensureNobleHashes()

  const digestBytes = hexToBytes(digest)
  const recovered = await signAsync(digestBytes, privateKey, {
    prehash: false,
    format: 'recovered',
  })

  if (recovered.length !== RECOVERED_SIGNATURE_BYTES) {
    throw new Error('Unexpected recovered signature length from secp256k1')
  }

  // noble recovered format: recovery || r || s
  const recovery = recovered[0]
  if (recovery !== 0 && recovery !== 1) {
    throw new Error('Invalid recovery bit in secp256k1 signature')
  }

  return serializeSignature({
    r: bytesToHex(recovered.subarray(1, 33)),
    s: bytesToHex(recovered.subarray(33, 65)),
    yParity: recovery,
  })
}
