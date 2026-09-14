/**
 * VOTAR-396 — Texto del manual técnico de transparencia para auditores.
 * Los pasos siguen la UI pública y los contratos on-chain reales.
 */

export const MANUAL_AUDITORES_HREF = '/manual/auditores'

export const SIN_VOTO_PREVIO =
  '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd'
export const VOTO_BLANCO =
  '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
export const VOTO_NULO =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export type ManualSection = {
  id: string
  title: string
  uat?: string
  body: string[]
  steps?: string[]
  note?: string
  /** Nota técnica (hashes) frente a aviso en prosa. */
  noteMono?: boolean
}

export const MANUAL_AUDITORES_SECTIONS: ManualSection[] = [
  {
    id: 'resumen',
    title: 'Qué permite comprobar este manual',
    body: [
      'Este manual es para un auditor u observador externo que no opera el comicio. Con el Dashboard Público y un explorador de bloques (Etherscan, en Sepolia) se puede validar la integridad del escrutinio sin depender de un informe de la Autoridad Electoral.',
      'La identidad del votante no viaja a la cadena: los eventos públicos usan un nullifier anónimo (voterHash) y hashes de longitud fija. Confirmar inclusión o recontar no revela a quién votó una persona. El detalle de privacidad está en la página de cumplimiento de la Ley 25.326.',
    ],
  },
  {
    id: 'escrutinio',
    title: 'Leer el escrutinio y la participación',
    body: [
      'Abrí el Dashboard Público del comicio en /comicios/{id}/dashboard. El {id} es el número del comicio. No hace falta iniciar sesión.',
      'Los números del escrutinio salen de la blockchain (fuente ON_CHAIN). El contrato AuditView expone lecturas sin gas — getParticipationStats y getVotesByCandidate — que leen los totales de VoteRegistry. Esos totales se actualizan con los eventos VoteCast y VoteUpdated de cada sufragio aceptado.',
      'Mientras el comicio está abierto, el panel de resultados se actualiza en vivo (marca “en vivo”). Al cierre, el snapshot queda congelado y aparece la insignia “Resultados Definitivos e Inmutables”: los indicadores ya no cambian.',
    ],
    steps: [
      'En Resumen ves el escrutinio provisional (si la autoridad lo publica), el total de habilitados del padrón, un resumen de participación y el estado del comicio.',
      'En Resultados ves gráficos de barras y torta, votos en blanco y, si el comicio los habilita, votos nulos. El porcentaje de cada candidato es votos / total de sufragios contabilizados.',
      'En Participación ves el porcentaje de afluencia, la fórmula transparente (padrón habilitado, votos afirmativos, en blanco y nulos) y la curva temporal. Desde ahí podés descargar un PNG de la curva.',
      'La exportación del escrutinio (Excel, PDF, CSV o JSON) solo aparece cuando el comicio está CERRADA o ESCRUTADA. Ese archivo es el cómputo publicado; más abajo se explica cómo contrastarlo con un recuento propio.',
      'Si una solapa dice “Sección no disponible”, la Autoridad Electoral la ocultó mientras el comicio está en curso. Resultados, Participación, Re-voto y Transacciones pueden ocultarse hasta el cierre. Padrón, Oferta electoral y Estado siguen visibles.',
      'En Re-voto, si la política es “Último voto válido”, los reescritos no suman un votante nuevo: el evento de re-voto ajusta el cómputo anterior. Las métricas salen de getRevoteStats (re-votos, votantes únicos y tasa de sobrescritura).',
    ],
  },
  {
    id: 'recibo',
    title: 'Verificar un sufragio individual',
    uat: 'UAT-01',
    body: [
      'Cada votante recibe un recibo criptográfico (PDF o pantalla de confirmación) con un TransactionHash. Ese hash es la prueba de inclusión. No contiene el candidato elegido ni datos personales.',
    ],
    steps: [
      'Abrí el verificador público en /verificar (también podés llegar desde el pie de este manual).',
      'Copiá el TransactionHash del recibo. Debe ser 0x seguido de 64 caracteres hexadecimales.',
      'Pegalo en “Hash de transacción” y pulsá “Verificar inclusión”.',
      'Si el sufragio está en la urna, la pantalla muestra “Inclusión confirmada”, el bloque, la red, el ID del comicio, la fecha y un enlace al explorador. La consulta se hace contra la blockchain y solo busca el evento SignedVoteCast de esa transacción.',
      'Si el hash no existe o fue alterado, aparece una advertencia roja de registro no encontrado. Un recibo válido nunca debe mostrar el candidato ni la identidad del votante.',
    ],
  },
  {
    id: 'recuento',
    title: 'Recalcular el escrutinio desde la blockchain',
    uat: 'UAT-04',
    body: [
      'El cómputo canónico no está solo en la interfaz. Cualquier persona puede descargar los eventos de VoteRegistry y reconstruir los totales. Un voto aceptado siempre deja un rastro público: si falta un evento, el recuento propio no coincide con getTally. Eso es lo que hace al escrutinio resistente a la censura.',
      'No uses solo el candidateId de VoteCast para recontar. VoteCast se emite una vez por boleta y su candidateId es el primer identificador de la selección (sirve para ver que hubo un sufragio). El desglose completo está en VoteUpdated: por cada candidato que entra o sale de la boleta hay un delta +1 o −1.',
      'La regla de reconstrucción es la misma que usa el contrato: por cada VoteUpdated, si newCandidate no es el centinela “sin voto previo”, sumá 1 a ese candidato; si oldCandidate no es ese centinela, restá 1. Ignorar el centinela en cualquiera de los dos lados reproduce getTally exactamente, sin revelar identidad.',
    ],
    steps: [
      'En el dashboard, abrí Estado y copiá la dirección de VoteRegistry y el ID del comicio (el número de la URL). Anotá también la dirección de AuditViewContract.',
      'Abrí VoteRegistry en Etherscan (el enlace de la ficha técnica). Red habitual: Sepolia; el chainId está en la misma ficha.',
      'En Events / Logs, filtrá el evento VoteUpdated por el electionId indexado. Exportá los logs (CSV del explorador o eth_getLogs contra un nodo público). Cada fila es un ajuste de cómputo.',
      'Recorré los eventos en orden de bloque. Ignorá el valor centinela SIN_VOTO_PREVIO. Sumá 1 al candidato de newCandidate y restá 1 al de oldCandidate cuando no sean el centinela. Un primer voto tiene oldCandidate = centinela (solo +1). Un re-voto “último voto válido” resta los ids anteriores y suma los nuevos. Un retiro de un id usa newCandidate = centinela (solo −1).',
      'VOTO_BLANCO y VOTO_NULO son ids reservados, no candidatos de la oferta. Contalos aparte y comparalos con votos en blanco y nulos del dashboard.',
      'Contrastá cada total con una lectura sin gas: en AuditViewContract, Read Contract, llamá getVotesByCandidate(electionId, candidateId) y getParticipationStats(electionId). totalVotes de esa vista son votantes únicos: un re-voto no los duplica.',
      'Si el comicio ya está cerrado, descargá el JSON o CSV desde Resultados y verificá que cada candidato coincide con tu suma. Si el explorador y el dashboard difieren, el cómputo publicado no es íntegro.',
    ],
    note: `Centinelas de VoteRegistry (uint256, 32 bytes): SIN_VOTO_PREVIO = ${SIN_VOTO_PREVIO}; VOTO_BLANCO = ${VOTO_BLANCO}; VOTO_NULO = ${VOTO_NULO}.`,
    noteMono: true,
  },
  {
    id: 'audit-log',
    title: 'Inspeccionar el Audit Log',
    uat: 'UAT-02',
    body: [
      'El Audit Log es el registro append-only de la operación institucional (apertura, cierre, carga de padrón, pausa, acta). No es la misma lista que Transacciones del dashboard: esas son eventos on-chain. El log operativo se consulta autenticado, con un usuario de Autoridad Electoral, porque incluye metadatos de operadores (id ofuscado y terminal criptográfica, nunca el DNI en claro).',
      'Las filas no se editan ni se borran. Buscar la apertura y el cierre de un comicio simulado es suficiente para ver que el rastro quedó inmutable.',
    ],
    steps: [
      'Iniciá sesión como Autoridad Electoral y abrí Auditoría en el menú lateral (/auditoria). Desde un comicio también está en /comicios/{id}/auditoria.',
      'En el filtro de tipo de evento, marcá “Apertura de comicio” y “Cierre de comicio”. Elegí el comicio. Dejá Nivel en “Todos” y pulsá Buscar.',
      'Abrí el detalle de cada fila. La descripción incluye el id ofuscado del operador (o “apertura/cierre automático por timestamp”), el identificador de terminal criptográfico y la hora UTC.',
      'Un comicio simulado que se abrió y se cerró debe mostrar al menos un evento Apertura de comicio y uno Cierre de comicio, en ese orden temporal. Si también hubo pausa, reanudación o acta de cierre, aparecen como “Pausa de emergencia”, “Reanudación de comicio” y “Acta de cierre generada”.',
    ],
    note: 'No uses el atajo “Eventos críticos” para esta comprobación: además de los tipos críticos, fija el nivel en ERROR. La apertura y el cierre exitosos se registran como INFO y ese filtro los ocultaría.',
  },
  {
    id: 'etherscan',
    title: 'Validar transacciones y la raíz Merkle',
    uat: 'UAT-03',
    body: [
      'La solapa Estado publica la ficha técnica on-chain: red, chainId, estado del contrato, raíz Merkle del padrón, límites de re-voto y las cuatro direcciones verificadas (BallotContract, VoteRegistry, AuditViewContract y MerkleRootStore). Cada dirección tiene un enlace a Etherscan.',
      'La raíz Merkle es el sello del padrón (hojas Keccak-256). El dashboard no publica el padrón nominativo. Lo que se compara es ese hash con el anclado en MerkleRootStore.',
    ],
    steps: [
      'Abrí /comicios/{id}/dashboard/estado. Copiá el “Hash del padrón” y anotá si figura como publicado on-chain.',
      'Abrí MerkleRootStore en Etherscan con el enlace de la ficha. Confirmá que estás en la red indicada (Sepolia si el chainId es 11155111).',
      'En Read Contract, llamá getMerkleRoot con el ID del comicio. El bytes32 devuelto debe ser idéntico al hash del dashboard, y el timestamp debe coincidir con la fecha de publicación mostrada en la ficha.',
      'Si tenés la compilación offline del padrón (el tree dump que generó la autoridad antes de abrir), su raíz debe ser ese mismo hash. Si no coincide, el padrón anclado no es el publicado.',
      'En Transacciones del dashboard, cada fila es un evento on-chain (de más reciente a más antiguo) con bloque, nombre de evento y enlace al explorador. Abrí una transacción y confirmá contrato, bloque y evento (por ejemplo SignedVoteCast en BallotContract, o VoteCast / VoteUpdated en VoteRegistry).',
      'Para un sufragio puntual, el mismo hash del recibo debe abrir la transacción en el explorador y mostrar el evento SignedVoteCast. Esa inspección no incluye el contenido del voto ni la identidad.',
    ],
  },
]
