import { describe, expect, it, vi } from 'vitest'
import { postRelayerCast } from '@/features/voto/api/voto-api'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import { VOTE_EIP712_TYPES } from '@/features/voto/crypto/constants'
import { assertRpcUrlsUseHttpsExceptLoopback } from '@/features/voto/crypto/rpc-failover'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'
import {
  buildRelayerCastBody,
  transmitSignedVote,
  type TransmitSignedVoteInput,
} from '@/features/voto/crypto/vote-transmitter'

const PII_TOKENS = [
  '30222333',
  'bruno@frvm.utn.edu.ar',
  'Bruno Pérez',
  'ana@frvm.utn.edu.ar',
]

const FORBIDDEN_PARAM_NAMES =
  /^(dni|email|nombre|apellido|documento|cuil|cuit|telefono|legajo)$/i

type AbiInput = {
  name: string
  type: string
  components?: AbiInput[]
}

/** Flatten top-level + tuple `components` (VOTAR-377 SignedVoteInput). */
const flattenAbiInputs = (inputs: readonly AbiInput[]): AbiInput[] =>
  inputs.flatMap((item) =>
    item.components?.length ? [item, ...item.components] : [item]
  )

const signed: SignedVotePayload = {
  electionId: 378,
  nullifier:
    '0x1111111111111111111111111111111111111111111111111111111111111111',
  selectionHash:
    '0x2222222222222222222222222222222222222222222222222222222222222222',
  candidateIds: [101n],
  timestamp: 1_700_000_000,
  expectedSigner: '0x00000000000000000000000000000000000000aa',
  signature: `0x${'ab'.repeat(65)}`,
}

const input: TransmitSignedVoteInput = {
  signed,
  voterLeaf:
    '0x3333333333333333333333333333333333333333333333333333333333333333',
  merkleProof: [
    '0x4444444444444444444444444444444444444444444444444444444444444444',
  ],
  validatorSignature: `0x${'cd'.repeat(65)}`,
}

describe('VOTAR-378 Ley 25.326 — payload de voto y HTTPS', () => {
  it('UAT-01: ABI de castSignedVote/SignedVoteCast no admite PII en claro', () => {
    const voteFn = BALLOT_CONTRACT_ABI.find(
      (fragment) =>
        fragment.type === 'function' && fragment.name === 'castSignedVote'
    )
    const signedVote = BALLOT_CONTRACT_ABI.find(
      (fragment) =>
        fragment.type === 'event' && fragment.name === 'SignedVoteCast'
    )

    expect(voteFn).toBeDefined()
    expect(signedVote).toBeDefined()

    const voteInputs = (
      voteFn && 'inputs' in voteFn ? voteFn.inputs : []
    ) as AbiInput[]
    const eventInputs = (
      signedVote && 'inputs' in signedVote ? signedVote.inputs : []
    ) as AbiInput[]
    const inputs = [
      ...flattenAbiInputs(voteInputs),
      ...flattenAbiInputs(eventInputs),
    ]

    for (const abiInput of inputs) {
      expect(abiInput.name).not.toMatch(FORBIDDEN_PARAM_NAMES)
      expect(abiInput.type).not.toMatch(/^string/)
    }

    // VOTAR-377: voterLeaf vive dentro de SignedVoteInput (tuple), no como arg top-level.
    // SignedVoteCast sigue sin exponerlo (anonimato on-chain).
    expect(inputs.some((item) => item.name === 'voterLeaf')).toBe(true)
    expect(eventInputs.some((item) => item.name === 'voterLeaf')).toBe(false)
    expect(eventInputs.map((item) => `${item.name}:${item.type}`)).toEqual([
      'electionId:uint256',
      'nullifier:bytes32',
      'selectionHash:bytes32',
      'signer:address',
    ])
    expect(VOTE_EIP712_TYPES.Vote.map((field) => field.type)).not.toContain(
      'string'
    )
  })

  it('UAT-01: el cast al relayer no envía DNI, email ni nombre', async () => {
    const relayCast = vi
      .fn()
      .mockResolvedValue({ txHash: `0x${'f'.repeat(64)}` })
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({
      status: 'success',
      blockNumber: 1n,
    })

    await transmitSignedVote(input, {
      publicClient: { waitForTransactionReceipt } as never,
      relayCast,
    })

    const body = buildRelayerCastBody(input, 'ab'.repeat(32))
    const payload = JSON.stringify(
      {
        relay: relayCast.mock.calls[0]?.[0],
        body,
      },
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value)
    )
    for (const token of PII_TOKENS) {
      expect(payload.toLowerCase()).not.toContain(token.toLowerCase())
    }
    expect(body).not.toHaveProperty('Authorization')
    expect(JSON.stringify(body)).not.toMatch(/cookie|bearer/i)
  })

  it('VOTAR-379 UAT-04: el POST al relayer omite cookies de sesión', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ txHash: `0x${'e'.repeat(64)}` }),
    })
    const body = buildRelayerCastBody(input, 'cd'.repeat(32))

    await postRelayerCast(input.signed.electionId, body, fetchImpl)

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.credentials).toBe('omit')
    expect(init.headers).not.toHaveProperty('Authorization')
    expect(init.headers).not.toHaveProperty('Cookie')
    expect(String(init.body)).not.toMatch(/Bearer|votar_voter|cookie/i)
  })

  it('UAT-02: RPC públicos deben ser HTTPS; HTTP sólo en loopback', () => {
    expect(() =>
      assertRpcUrlsUseHttpsExceptLoopback([
        'https://sepolia.infura.io/v3/aaa',
        'https://eth-sepolia.g.alchemy.com/v2/bbb',
      ])
    ).not.toThrow()
    expect(() =>
      assertRpcUrlsUseHttpsExceptLoopback(['http://127.0.0.1:8545'])
    ).not.toThrow()
    expect(() =>
      assertRpcUrlsUseHttpsExceptLoopback(['http://sepolia.infura.io/v3/aaa'])
    ).toThrow(/HTTPS/)
  })
})
