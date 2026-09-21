/**
 * VOTAR-389 — Texto del manual del votante (BUD).
 * Misma fuente para la guía web y el PDF, con rótulos y capturas
 * que coinciden con la cabina desplegada (UAT-02).
 */

export const MANUAL_VOTANTE_HREF = '/manual/votante'
export const MANUAL_VOTANTE_PDF_FILENAME = 'manual-votante-bud.pdf'
export const VERIFICADOR_HREF = '/verificar'
export const PORTAL_TRANSPARENCIA_HREF = '/comicios/{id}/dashboard'
export const CABINA_HREF = '/comicios/{id}/votar'

export type ManualVotanteScreenshot = {
  src: string
  alt: string
  /** Rótulos exactos visibles en esa captura. */
  screen?: string[]
}

export type ManualVotanteSection = {
  id: string
  /** Número de paso visible. Las secciones de contexto no lo llevan. */
  step?: string
  title: string
  uat?: string
  body: string[]
  steps?: string[]
  /** Capturas reales de la UI desplegada (UAT-02). */
  screenshots?: ManualVotanteScreenshot[]
  note?: string
}

export const MANUAL_VOTANTE_SECTIONS: ManualVotanteSection[] = [
  {
    id: 'antes',
    title: 'Antes de empezar',
    body: [
      'Esta guía explica, paso a paso, cómo emitir el voto en la Boleta Única Digital (BUD) y cómo comprobar después que fue contabilizado. No hace falta saber de tecnología.',
      'Necesitás tu número de legajo, tu clave institucional y que el correo de Datos Personales en Autogestión coincida con el del padrón. Usá un navegador actualizado. Nadie del sistema puede ver a quién votaste.',
    ],
  },
  {
    id: 'inicio-sesion',
    step: '01',
    title: 'Iniciar sesión',
    uat: 'UAT-01',
    body: [
      'La cabina es la página de votación del comicio. El acceso es con tu cuenta institucional (inicio de sesión único de la institución). No uses la clave de otra persona ni la compartas.',
      `Abrí la cabina en ${CABINA_HREF}. El {id} es el número del comicio que te indicó la autoridad electoral.`,
    ],
    steps: [
      'En la pantalla Bienvenido, completá Número de Legajo y Clave Institucional.',
      'Pulsá Ingresar. Si los datos no coinciden, vas a ver un mensaje genérico de error. Revisá el legajo y la clave. El correo de Datos Personales en Autogestión tiene que ser el mismo que figura en el padrón.',
      'Si en lugar del formulario ves Iniciar sesión con Google, el comicio está configurado con esa cuenta. Usá la cuenta institucional que te indicó la autoridad.',
      'Cuando entres, arriba dice VOTAR y Boleta Única Digital. Esa es la cabina. Desde ahí, y también desde el login, podés volver a abrir este manual.',
    ],
    screenshots: [
      {
        src: '/manual-votante/01-inicio-sesion.png',
        alt: 'Pantalla de inicio de sesión',
        screen: [
          'VOTAR',
          'Bienvenido',
          'Número de Legajo',
          'Clave Institucional',
          'Ingresar',
          'Manual del votante',
          'Cómo protegemos tus datos (Ley 25.326)',
        ],
      },
    ],
    note: 'Cerrar sesión no gasta un intento de voto. Si te equivocaste de cuenta, cerrá sesión y volvé a entrar.',
  },
  {
    id: 'seleccion',
    step: '02',
    title: 'Elegir tu voto',
    uat: 'UAT-01',
    body: [
      'Después del ingreso aparece Antes de votar, con el nombre del comicio. Revisá que sea el comicio correcto y pulsá Comenzar a votar.',
      'Si el comicio permite cambiar el voto, arriba vas a ver Intentos restantes: N. Ese número indica cuántas veces más podés emitir o modificar tu voto; cada emisión exitosa gasta un intento y vale el último voto registrado. Cerrar sesión no gasta un intento.',
      'La boleta puede pedirte una lista completa o candidatos por rol. Elegí la opción que quieras. Podés cambiarla antes de confirmar.',
    ],
    steps: [
      'Leé el título de la boleta: Listas completas o Candidatos por rol.',
      'Elegí la lista o los candidatos tocando la tarjeta. Si el comicio lo permite, también podés elegir Votar en blanco. Anular voto solo aparece si la autoridad lo habilitó.',
      'Cuando la elección esté hecha, el botón Continuar se habilita. Pulsalo.',
      'Si ya habías votado y el comicio permite cambiar el voto, podés ver Ya tienes un voto registrado en este comicio y el botón Modificar mi voto.',
    ],
    screenshots: [
      {
        src: '/manual-votante/02a-antes-de-votar.png',
        alt: 'Pantalla Antes de votar',
        screen: [
          'VOTAR',
          'Manual del votante',
          'Intentos restantes',
          'Cerrar sesión',
          'Inicio',
          'Antes de votar',
          'Comicio',
          'Boleta',
          'Estado',
          'Categorías habilitadas',
          'Antes de continuar',
          'Comenzar a votar',
          'Cómo protegemos tus datos (Ley 25.326)',
        ],
      },
      {
        src: '/manual-votante/02b-seleccion.png',
        alt: 'Boleta con listas completas',
        screen: [
          'VOTAR',
          'Manual del votante',
          'Intentos restantes',
          'Cerrar sesión',
          'Voto',
          'Listas completas',
          'Opciones especiales',
          'Votar en blanco',
          'Anular voto',
          'Continuar',
          'Cómo protegemos tus datos (Ley 25.326)',
        ],
      },
    ],
  },
  {
    id: 'firma',
    step: '03',
    title: 'Revisar y firmar',
    uat: 'UAT-01',
    body: [
      'La pantalla Confirmar Voto muestra lo que elegiste. Leé el resumen. Si no es lo que querías, pulsá Volver y cambiá la selección. Todavía no emitiste el voto.',
      'Al confirmar, el navegador firma tu elección en este dispositivo. El servidor no guarda a quién votaste. Esperá sin cerrar la pestaña hasta ver el resultado.',
    ],
    steps: [
      'Revisá lista, candidatos o voto en blanco en el resumen.',
      'Pulsá Firmar y confirmar. El botón pasa a Firmando voto... mientras se registra.',
      'Si el botón dice Votación pausada, el comicio está detenido. No confirmes: esperá a que vuelva a decir Firmar y confirmar.',
      'No cierres el navegador en este paso. Si aparece un error, leé el mensaje y usá Volver o el reintento que te ofrezca la pantalla. Tu elección no se publica con tu nombre.',
    ],
    screenshots: [
      {
        src: '/manual-votante/03-confirmar-firma.png',
        alt: 'Pantalla Confirmar Voto',
        screen: [
          'VOTAR',
          'Manual del votante',
          'Intentos restantes',
          'Cerrar sesión',
          'Confirmación',
          'Confirmar Voto',
          'Selección especial',
          'Voto en blanco',
          'Volver',
          'Firmar y confirmar',
          'Cómo protegemos tus datos (Ley 25.326)',
        ],
      },
    ],
    note: 'Si aparece “Clave de votación efímera generada”, es normal: esa clave se crea solo en tu navegador para este voto y no se guarda en el servidor.',
  },
  {
    id: 'recibo',
    step: '04',
    title: 'Descargar el comprobante',
    uat: 'UAT-01',
    body: [
      'Cuando veas Voto Exitoso, el voto ya fue registrado. Guardá el comprobante antes de cerrar la sesión. El PDF se arma en tu navegador y no queda guardado en el servidor.',
      'El Hash de transacción es el código largo que empieza con 0x. Sirve para comprobar que el voto fue contabilizado. No dice a quién votaste ni incluye tu nombre.',
    ],
    steps: [
      'En Comprobante criptográfico, copiá el Hash de transacción o dejalo a la vista.',
      'Pulsá Descargar comprobante PDF y guardá el archivo en un lugar que recuerdes (descargas del dispositivo o un correo propio).',
      'Si el PDF no se genera, no cierres la pantalla: el hash sigue visible. Copialo a mano o en un mensaje para vos. Si dice No se pudo descargar el PDF, reintentá la descarga.',
      'Cerrar sesión cuando ya tengas el comprobante. Si el comicio permite cambiar el voto, vas a ver Modificar mi voto. El comprobante del intento anterior sigue sirviendo para verificar ese registro.',
    ],
    screenshots: [
      {
        src: '/manual-votante/04-comprobante.png',
        alt: 'Pantalla Voto Exitoso con Hash de transacción y Descargar comprobante PDF',
        screen: [
          'VOTAR',
          'Manual del votante',
          'Intentos restantes',
          'Cerrar sesión',
          'Éxito',
          'Voto Exitoso',
          'Comprobante criptográfico',
          'Hash de la transacción',
          'Descargar comprobante PDF',
          'Modificar mi voto',
          'Cómo protegemos tus datos (Ley 25.326)',
        ],
      },
    ],
  },
  {
    id: 'verificacion',
    step: '05',
    title: 'Confirmar el voto en el Portal de Transparencia',
    uat: 'UAT-03',
    body: [
      'El Portal de Transparencia es público: no hace falta iniciar sesión ni decir a quién votaste. Con el hash del comprobante confirmás que ese sufragio fue contabilizado. Los resultados generales, sin datos personales, están en el dashboard público del comicio.',
      `El verificador individual está en ${VERIFICADOR_HREF}. El dashboard del comicio está en ${PORTAL_TRANSPARENCIA_HREF}.`,
    ],
    steps: [
      'Abrí el verificador del Portal de Transparencia en /verificar. También podés llegar desde el pie de este manual.',
      'Copiá el Hash de transacción del comprobante. Tiene que empezar con 0x y tener 64 caracteres después.',
      'Pegalo en Hash de transacción y pulsá Verificar inclusión.',
      'Si el voto fue contabilizado, vas a leer Inclusión confirmada, con el bloque, la red y el comicio. No vas a ver el candidato ni tu nombre: eso es lo esperado.',
      'Si aparece un aviso de registro no encontrado, el voto no está contabilizado. Conservá el comprobante y avisá a la autoridad electoral. No hace falta decir a quién votaste.',
      'Para ver participación y resultados del comicio, sin datos de personas, abrí el dashboard público en /comicios/{id}/dashboard. Es de solo lectura.',
    ],
    screenshots: [
      {
        src: '/manual-votante/05-verificacion.png',
        alt: 'Verificador con Hash de transacción',
        screen: [
          'VOTAR',
          'Verificación pública',
          'Acceso público',
          'Verificador de voto individual',
          'Hash del recibo',
          'Hash de la transacción',
          'Verificar inclusión',
          'Nueva búsqueda',
          'Inclusión confirmada',
          'Certificación blockchain',
          'Ver en explorador de bloques',
          'Privacidad del sufragio garantizada',
          'Privacidad garantizada',
        ],
      },
    ],
    note: 'Un comprobante válido nunca muestra el candidato elegido ni tu identidad. Si una pantalla te pide el DNI para “verificar” el voto, no es este portal.',
  },
  {
    id: 'accesibilidad',
    title: 'Leer esta guía con un lector de pantalla',
    uat: 'UAT-04',
    body: [
      'La guía web es la versión principal. Está en una sola página, con un índice al inicio y un título por paso. El atajo Saltar al contenido salta el encabezado. El PDF descargable es texto, no una foto, así también se puede leer en voz alta. En la guía web, las capturas de pantalla tienen texto alternativo; el PDF aún no incluye texto alternativo en las imágenes.',
      'Los botones dicen qué hacen. En la cabina, los más importantes son Ingresar, Comenzar a votar, Continuar, Firmar y confirmar y Descargar comprobante PDF. En el verificador, el botón es Verificar inclusión.',
    ],
    steps: [
      'Recorré los títulos o usá el índice. Cada paso se puede abrir para ver los textos exactos de la pantalla.',
      'Si usás teclado, el foco visible marca el enlace o botón activo. No hace falta el mouse.',
      'Descargá el PDF con Descargar manual en PDF si preferís leerlo fuera del navegador o imprimirlo.',
    ],
  },
]
