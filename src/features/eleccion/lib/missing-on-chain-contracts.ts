/** VOTAR-473: error when CONFIGURADA but ElectionFactory has no deployment. */
export const isMissingOnChainContractsError = (
  message: string | null | undefined
): boolean =>
  typeof message === 'string' &&
  /contratos electorales desplegados on-chain/i.test(message)
