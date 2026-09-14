/**
 * VOTAR-395 — Manual operativo del Panel de Gestión para la Autoridad Electoral.
 * Los pasos siguen la UI autenticada y las operaciones on-chain que dispara el panel.
 * La ruta vive bajo `/_authenticated`: exige sesión y rol `election_admin`.
 */

export const MANUAL_AUTORIDAD_HREF = '/manual'

export const MANUAL_AUTORIDAD_NAV_TITLE = 'Manual operativo'

export type ManualSection = {
  id: string
  title: string
  uat?: string
  body: string[]
  steps?: string[]
  note?: string
}

export const MANUAL_AUTORIDAD_SECTIONS: ManualSection[] = [
  {
    id: 'acceso',
    title: 'Quién puede ver este manual',
    body: [
      'Este manual es solo para la Autoridad Electoral. Está en el Panel de Gestión, no en el Dashboard Público ni en la Boleta Única Digital.',
      'Para abrirlo hace falta iniciar sesión en /sign-in con una cuenta de administrador. El panel admite únicamente el rol election_admin. Si la cuenta no tiene ese rol, o si quien entra es un votante, la aplicación redirige a la pantalla de acceso denegado (403) y no muestra el contenido. Sin sesión, redirige al login y vuelve a esta página después de autenticarse.',
      'El enlace “Manual operativo” está en el sidebar del panel (y en el buscador de comandos del encabezado). No aparece en la interfaz del votante ni en el dashboard anónimo.',
    ],
    note: 'Si el login de administrador pide un segundo factor, completalo antes de seguir. Sin la sesión completa el panel no abre.',
  },
  {
    id: 'ciclo-de-vida',
    title: 'Crear el comicio, cargar categorías y oficializar',
    uat: 'UAT-01',
    body: [
      'Un comicio nuevo nace en BORRADOR. Recién se puede abrir cuando está CONFIGURADA: oferta congelada, padrón cargado y raíz de Merkle publicada. Esta sección cubre la creación, las fechas, las categorías y la oficialización. El padrón y el anclaje están en la sección siguiente; los dos bloques juntos son el recorrido de un operador nuevo.',
    ],
    steps: [
      'En el sidebar, Comicios → Nuevo comicio (/comicios/nuevo). Completá Nombre, Descripción (opcional), Apertura y Cierre. El cierre tiene que ser posterior a la apertura. Pulsá “Crear comicio”. El aviso confirma el ID y el estado BORRADOR: anotá ese número, es el {id} de las rutas.',
      'Entrá a la oferta del comicio en /comicios/{id}/oferta. En Categorías, “Nueva categoría”: nombre, descripción opcional, “Mín. postulantes por lista” y máximo. El mínimo es el cupo que el motor de reglas exige al oficializar. El mínimo no puede superar al máximo.',
      '“Nueva lista” abre el alta de la lista electoral. Dentro de cada lista, cargá candidatos en cada categoría, al menos tantos como el mínimo de esa categoría. Repetí hasta cubrir la oferta.',
      'Antes de oficializar, cargá el padrón (sección siguiente). Si no hay padrón, la oferta muestra “Padrón electoral requerido” y un enlace a la carga. No se puede oficializar sin electores.',
      'Con padrón y listas completas, pulsá “Oficializar comicio” y confirmá “¿Oficializar el comicio?”. Es irreversible: ya no se pueden crear, editar ni eliminar listas ni candidatos. El comicio pasa a CONFIGURADA y se generan los list_id para la cadena. La oferta queda marcada como “Oferta congelada”.',
      'Si la confirmación falla por fondos de la wallet, el comicio puede quedar oficializado en la base y sin despliegue on-chain. El panel permite reintentar ese despliegue sin volver a oficializar. No crees un segundo comicio para “arreglarlo”.',
    ],
  },
  {
    id: 'padron-merkle',
    title: 'Importar el padrón y anclar la raíz de Merkle',
    uat: 'UAT-01',
    body: [
      'El padrón no se publica en claro. El panel guarda el listado off-chain y ancla en Sepolia solo la raíz de Merkle: un hash que permite probar después, sin revelar DNI ni correo, que un elector estaba habilitado.',
    ],
    steps: [
      'Desde el comicio, abrí “Ver padrón” (/comicios/{id}/padron) y usá “Cargar padrón electoral”. El archivo puede ser .csv, .xlsx o .xls.',
      'Las columnas obligatorias son DNI y Email: forman la identidad del elector (alineada con el login institucional). Nombre, Apellido y Dirección son opcionales. Si el archivo usa otros encabezados, marcalos en “Campos del archivo CSV / Excel”. “Descargar CSV ejemplo” baja una plantilla con el formato esperado.',
      'Al enviar, el panel muestra una vista previa. Confirmá la importación solo si los totales cierran. Si hubo filas omitidas (duplicados o datos inválidos), descargá “Descargar reporte de novedades” y corregí el archivo antes de dar el padrón por cerrado. Un padrón con omitidos no explicados no está listo para anclar.',
      'En “Sello de integridad on-chain”, pulsá “Publicar Raíz on-chain” y confirmá el diálogo. La operación ancla la raíz en MerkleRootStore, en Sepolia. Esperá a que termine en segundo plano. El sello pasa a “Publicado on-chain”.',
      'Sin esa publicación, “Abrir comicio” se rechaza con el aviso “Fallo de Precondición: Raíz de Merkle no detectada en la red descentralizada”. No fuerces la apertura: volvé a publicar la raíz.',
      'Para comprobar el anclaje: en el Dashboard Público, solapa Estado, copiá el hash del padrón y contrastalo con getMerkleRoot del contrato MerkleRootStore en Etherscan (la ficha muestra la dirección y la red). Tienen que coincidir.',
    ],
    note: 'Sepolia es la red de prueba del comicio. El chainId y las direcciones de contrato salen de la ficha técnica del dashboard, no de una nota suelta.',
  },
  {
    id: 'contratos',
    title: 'Abrir, pausar, reanudar, cerrar y archivar',
    body: [
      'Estas acciones se disparan desde el panel, en Sepolia. Cada botón que cambia el estado on-chain arma y envía la transacción; no hace falta pegar calldata ni entrar a una consola. La confirmación puede tardar: el panel sigue usable mientras la transacción corre en segundo plano.',
      'Dónde están los botones: en Ver comicios (/comicios) y en la oferta del comicio (/comicios/{id}/oferta). Solo aparece la acción que el estado permite.',
    ],
    steps: [
      'Abrir comicio: solo en CONFIGURADA, y solo si la raíz de Merkle ya está on-chain. Confirmá el diálogo “Abrir comicio”. El contrato pasa a abierto, se habilita la boleta y el estado queda ABIERTA. Desde ahí está disponible el Acta de Apertura.',
      'Pausar comicio: solo si está abierto y no pausado. El diálogo es “Pausa de emergencia”. Escribí una razón de al menos 10 caracteres (el motivo queda registrado). Nadie pausa en solitario: otra cuenta con rol PAUSER tiene que confirmar la misma solicitud. Recién entonces el panel llama a pause() en BallotContract y en VoteRegistry, en Sepolia. Bloquea votos nuevos; las consultas de lectura siguen. En la boleta, el votante ve “Sistema en pausa” y el texto de que la autoridad electoral pausó la urna.',
      'Reanudar comicio: aparece cuando el comicio está pausado. Diálogo “Reanudar comicio”, razón de al menos 10 caracteres y una segunda autoridad PAUSER. El panel llama a unpause() en los mismos contratos. No reanudes si el incidente que motivó la pausa sigue abierto.',
      'Cerrar comicio: el botón está en estado ABIERTA, también si el comicio está pausado. No hace falta reanudar solo para cerrar. Confirmá “Sí, cerrar comicio”. El panel sincroniza el estado CLOSED en la cadena. El comicio pasa a CERRADA, los sufragios nuevos reciben HTTP 410 y el Dashboard Público congela resultados definitivos.',
      'Archivar comicio: solo en CERRADA, desde Ver comicios. “Archivar Comicio” y confirmá “Sí, archivar comicio”. Es el cierre administrativo del ciclo (pasa a histórico). En la cadena el contrato ya quedó inmutable en CLOSED al cerrar; archivar no manda otra transacción. El registro de auditoría de ese comicio sigue consultable.',
    ],
    note: 'Cada transición deja un evento crítico en Auditoría: Apertura de comicio, Pausa de emergencia, Reanudación de comicio, Cierre de comicio, Archivado de comicio. Si el botón muestra un error y ofrece reintentar, reintentá esa misma acción; no abras un comicio nuevo.',
  },
  {
    id: 'reporteria',
    title: 'Actas y exportación del escrutinio',
    uat: 'UAT-03',
    body: [
      'La documentación de cierre no se arma a mano. El panel genera el PDF del acta y el Dashboard Público exporta el escrutinio leído de la cadena. El cotejo es parte del cierre: el archivo institucional tiene que coincidir con lo publicado on-chain.',
    ],
    steps: [
      'El formato de las actas (qué bloques se imprimen, logo, texto institucional) se define una vez en Configuración → Configuración institucional (/configuracion), en los acordeones de Acta de Apertura y Acta de Cierre. Hacelo antes del día del comicio, no durante el cierre.',
      'Con el comicio ABIERTA, CERRADA, ESCRUTADA o ARCHIVADA, en el comicio abrí “Actas oficiales” y elegí “Acta de Apertura”. El PDF se descarga en el navegador.',
      'El Acta de Cierre aparece cuando el estado es CERRADA, ESCRUTADA o ARCHIVADA. Al generarla, el sistema registra el hash del documento. En Auditoría queda el evento “Acta de cierre generada”.',
      'Para el escrutinio público, abrí /comicios/{id}/dashboard. En Resultados, “Exportar resultados” ofrece XLSX, PDF, CSV o JSON. Ese menú solo existe si el comicio está CERRADA o ESCRUTADA. Mientras está abierto, no hay exportación: los números todavía pueden cambiar.',
      'Cotejo: los totales del archivo (afirmativos por candidato, blanco y, si el comicio lo habilita, nulo) tienen que ser los mismos que la solapa Resultados, cuya fuente es ON_CHAIN (getVotesByCandidate y getParticipationStats de AuditView). Si no coinciden, no des por cerrado el comicio ni archives. Reintentá la exportación y, si la diferencia persiste, registrá el incidente en Auditoría antes de escalar. No edites el PDF para “hacerlo coincidir”.',
    ],
  },
  {
    id: 'listas-incompletas',
    title: 'Lista que no cumple el cupo de candidatos',
    uat: 'UAT-04',
    body: [
      'Oficializar con una lista incompleta no es un error de red: el motor de reglas rechaza el comicio. El panel no congela la oferta hasta que cada lista cubre el mínimo de cada categoría.',
    ],
    steps: [
      'Si oficializás y aparece el alerta “No se puede oficializar el comicio”, leé cada ítem. El mensaje indica la lista, cuántos candidatos faltan, la categoría, cuántos tiene y el mínimo. Ejemplo: La lista "Lista A" requiere 3 candidato(s) más en la categoría "Presidente" (tiene 2, mínimo 5).',
      'No reintentes la oficialización en el mismo estado. Anotá lista y categoría del mensaje.',
      'Abrí esa lista en la oferta (el comicio sigue en BORRADOR, se puede editar). En la categoría señalada, cargá los candidatos que faltan hasta alcanzar el mínimo. El número “Mín. postulantes por lista” de la categoría es la regla; lo ves en la ficha de la categoría.',
      'Si el reglamento de ese comicio permite un cupo menor, y solo si el comicio sigue en BORRADOR, bajá el mínimo de la categoría y guardá. No lo bajes para “pasar” una lista que el reglamento exige completa.',
      'Volvé a “Oficializar comicio”. Si queda otra violación, el alerta lista todas: resolvé cada una antes de reintentar otra vez.',
      'Otros bloqueos distintos del cupo, con el mismo título de alerta o con “Padrón electoral requerido”: falta el padrón; no hay ninguna lista con candidatos; hay una categoría sin listas. El texto del alerta dice cuál es. Corregí eso, no el cupo.',
    ],
  },
  {
    id: 'contingencia-sso',
    title: 'Caída del SSO: pausar y avisar a los votantes',
    uat: 'UAT-02',
    body: [
      'El votante entra a la boleta con SSO institucional. Si ese servicio cae, no puede autenticarse y no debe seguir intentando emitir un voto. La sesión del panel de autoridad es otra (login de administrador): podés operar el comicio aunque el SSO del votante esté caído. Si vos también perdés la sesión del panel, el problema no es el SSO del votante: es la sesión de administrador. Reingresá en /sign-in antes de pausar.',
    ],
    steps: [
      'Confirmá el síntoma: un votante de prueba no puede iniciar sesión en la boleta, o el organismo informa que el SSO institucional no responde. No cierres el comicio por eso.',
      'En el comicio abierto, “Pausar comicio”. Razón concreta, al menos 10 caracteres, por ejemplo: “Caída del SSO institucional. Se pausa la urna y se notifica a los votantes.” Pedí a otra autoridad PAUSER que confirme la misma solicitud. La pausa no está hecha hasta que la transacción confirma.',
      'Aviso a los votantes: quien ya tiene la boleta abierta ve “Sistema en pausa” y que el envío está deshabilitado. Quien no puede entrar porque el SSO está caído no ve ese cartel. Avisá por el canal institucional del organismo (correo o aviso oficial) que el comicio está pausado y que no reintenten el voto hasta el aviso de reanudación. No pidas contraseñas ni códigos por ese canal.',
      'Seguimiento: en Auditoría (/auditoria), filtrá por “Pausa de emergencia”. El detalle del evento conserva la razón. Eso es el registro del incidente de esta caída.',
      'Cuando el SSO vuelve, hacé un login de prueba en la boleta. Si entra, “Reanudar comicio” con una razón de restablecimiento y la segunda confirmación PAUSER. Comprobá en Auditoría el evento “Reanudación de comicio”.',
      'Escalamiento: si la pausa no confirma (la transacción queda pendiente o falla), no des por cerrada la contingencia y no abras ni cierres el comicio para “saltear” la pausa. Escalalo a quien opera la wallet PAUSER y el nodo. Repetí la confirmación cuando la red vuelva a aceptar la transacción.',
    ],
  },
  {
    id: 'contingencia-rpc',
    title: 'Caída de un nodo RPC: respaldo e incidente',
    uat: 'UAT-05',
    body: [
      'Las lecturas y las transacciones salen por un nodo de Sepolia. Si el primario no responde, el sistema cambia solo al nodo de respaldo. No hay que pegar otra URL en el panel. El cambio deja un aviso [VOTAR rpc-failover] en los logs del servicio.',
      'El síntoma en pantalla: una apertura, pausa o voto no confirma, o el Dashboard Público dice que el nodo RPC no responde. Un timeout no significa que el voto se perdió: puede estar en curso por el nodo de respaldo.',
    ],
    steps: [
      'No reenvíes a mano una transacción que el panel dejó “en segundo plano”. Recargá el panel y la solapa Estado del dashboard público.',
      'Si las lecturas vuelven (estado del contrato, escrutinio, dirección de los contratos), el nodo de respaldo tomó el tráfico. El comicio sigue. No cambies de red ni crees otro contrato.',
      'Registro del incidente: en Auditoría no hay un tipo “RPC caído”. Si el comicio está abierto y no podés confirmar que las escrituras entran, “Pausar comicio” con una razón que incluya “Caída de nodo RPC”, la hora y “se continúa por nodo de respaldo”. Esa razón queda en “Pausa de emergencia” y es el registro institucional. Cuando Estado vuelva a responder, “Reanudar comicio” con la razón de restablecimiento. Esos dos eventos son el seguimiento.',
      'Si las lecturas ya volvieron solas y los votos siguen, no pauses solo para anotar. El registro técnico es el aviso [VOTAR rpc-failover]. Pedí a quien administra el despliegue que conserve ese log, y anotá la hora en el canal de operación. En el panel, la prueba de que se siguió operando son los eventos posteriores en Auditoría.',
      'Escalamiento: si tampoco el respaldo responde (el panel sigue sin lecturas on-chain después de recargar), no des el comicio por restablecido, no publiques resultados y no archives. Escalalo a quien administra SEPOLIA_RPC_URL y SEPOLIA_RPC_FALLBACK_URLS. El criterio es: un nodo caído se absorbe con el respaldo; los dos caídos se escalan, no se improvisan.',
    ],
    note: 'El respaldo es automático solo si el despliegue tiene configurado el nodo secundario. Si el equipo técnico confirma que no hay respaldo, el paso correcto es pausar y escalar, no buscar un nodo público suelto desde el navegador.',
  },
]
