# Política de seguridad

VOTAR es software electoral. Un defecto puede afectar la integridad del
escrutinio, el secreto del voto o la disponibilidad de un comicio. Pedimos
reporte responsable: no publiques el detalle hasta coordinar la corrección.

## Qué reportar

- Fallas de autenticación, sesión, CSP, XSS o exposición de datos personales.
- Fugas de secretos (`.env`, tokens, claves de billetera, padrones).
- Cualquier camino que vincule la identidad del votante con el contenido del
  sufragio.

No uses este canal para bugs de interfaz sin impacto de seguridad. Abrí un
issue normal.

## Cómo reportar

1. No abras un issue público ni un pull request con un exploit.
2. Usá el reporte privado de GitHub:
   <https://github.com/PFISI-Votar/front/security/advisories/new>
3. Incluí componente, commit o tag, impacto, pasos de reproducción y si el
   problema ya es explotable en un entorno publicado.

Si ese canal no está habilitado, contactá a los maintainers de la organización
`PFISI-Votar` por un medio privado. No envíes pruebas de concepto a listas
públicas.

## Qué no hacer

- No uses el hallazgo contra un comicio real, un padrón real ni la testnet de
  terceros más allá de lo necesario para confirmar el reporte.
- No extraigas datos personales.
- No publiques un advisory por tu cuenta antes de coordinarlo.

## Plazos de respuesta

| Hito                         | Plazo            |
| ---------------------------- | ---------------- |
| Acuse de recibo              | 3 días hábiles   |
| Evaluación inicial de impacto | 10 días hábiles |
| Corrección o mitigación      | Según severidad  |

## Alcance

En alcance: este repositorio y su interacción con la API y los contratos
públicos de VOTAR.

Fuera de alcance: Autogestión UTN, proveedores de RPC (Alchemy, Infura) y la
infraestructura de GitHub. Si el problema está en un tercero, reportalo también
a ese proveedor.

## Versiones

Se mantienen la etiqueta estable más reciente (`v2.0.0` al publicar esta
política) y la rama `dev`. El modelo de tags está en
[docs/VERSIONADO.md](./docs/VERSIONADO.md).
