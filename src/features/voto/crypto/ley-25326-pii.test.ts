import { describe, expect, it, vi } from 'vitest'
import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import { VOTE_EIP712_TYPES } from '@/features/voto/crypto/constants'
import { assertRpcUrlsUseHttpsExceptLoopback } from '@/features/voto/crypto/rpc-failover'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'
import {
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

type AbiInput = { name: string; type: string }

const signed: SignedVotePayload = {
  electionId: 378,
  nullifier:
    '0x1111111111111111111111111111111111111111111111111111111111111111',
  selectionHash:
    '0x2222222222222222222222222222222222222222222222222222222222222222',
  candidateId: 101n,
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

    const inputs = [
      ...((voteFn && 'inputs' in voteFn ? voteFn.inputs : []) as AbiInput[]),
      ...((signedVote && 'inputs' in signedVote
        ? signedVote.inputs
        : []) as AbiInput[]),
    ]
    for (const input of inputs) {
      expect(input.name).not.toMatch(FORBIDDEN_PARAM_NAMES)
      expect(input.type).not.toMatch(/^string/)
    }

    expect(inputs.some((item) => item.name === 'voterLeaf')).toBe(true)
    expect(
      (signedVote && 'inputs' in signedVote ? signedVote.inputs : []).map(
        (item) => `${item.name}:${item.type}`
      )
    ).toEqual([
      'electionId:uint256',
      'nullifier:bytes32',
      'selectionHash:bytes32',
      'signer:address',
    ])
    expect(VOTE_EIP712_TYPES.Vote.map((field) => field.type)).not.toContain(
      'string'
    )
  })

  it('UAT-01: transmitSignedVote no envía DNI, email ni nombre en args JSON-RPC', async () => {
    const estimateContractGas = vi.fn().mockResolvedValue(100_000n)
    const writeContract = vi.fn().mockResolvedValue(`0x${'f'.repeat(64)}`)
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({
      status: 'success',
      blockNumber: 1n,
    })

    await transmitSignedVote(input, {
      publicClient: {
        estimateContractGas,
        waitForTransactionReceipt,
      } as never,
      walletClient: {
        account: { address: '0x00000000000000000000000000000000000000bb' },
        chain: { id: 31_337 },
        writeContract,
      } as never,
      contractAddress: '0x0000000000000000000000000000000000000001',
    })

    const payload = JSON.stringify(
      {
        estimate: estimateContractGas.mock.calls[0]?.[0],
        write: writeContract.mock.calls[0]?.[0],
      },
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value)
    )
    for (const token of PII_TOKENS) {
      expect(payload.toLowerCase()).not.toContain(token.toLowerCase())
    }
    expect(writeContract.mock.calls[0]?.[0].functionName).toBe('castSignedVote')
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
