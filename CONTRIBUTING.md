# Cómo contribuir

Gracias por auditar o mejorar **VOTAR — Frontend**. Este repositorio es software
electoral open source (MIT). Las contribuciones se publican bajo la misma
licencia: al enviar un pull request aceptás esos términos.

## Qué se espera de una colaboración

- Discutí cambios grandes en un issue antes de abrir un PR amplio.
- No abras un issue público para vulnerabilidades. Usá [SECURITY.md](./SECURITY.md).
- No incluyas secretos, `.env`, tokens, claves privadas ni datos reales de padrón.
- Mantené el alcance chico y alineado a una historia (convención `VOTAR-NNN`).

## Ramas

| Rama     | Rol                                                                 |
| -------- | ------------------------------------------------------------------- |
| `master` | Versión estable publicada. Es la rama por defecto de GitHub.       |
| `dev`    | Integración. Los pull requests se abren contra `dev`.              |

Nombres de rama:

- `feature/votar-NNN-descripcion-breve`
- `fix/votar-NNN-descripcion-breve`

## Entorno

Requisitos y variables: [README.md](./README.md).

```bash
git clone https://github.com/PFISI-Votar/front.git
cd front
git checkout dev
npm ci
cp .env.example .env
npm run dev
```

Para verificar que el código compila sin levantar el stack completo:

```bash
npm ci
npm run build
```

## Antes de abrir el pull request

```bash
npm run lint
npm run format:check
npm run test:unit
npm run licenses:check
```

`npm run ci:local` cubre el mismo circuito que usa la integración continua, salvo
los tests de browser.

## Revisión

El equipo Five Stack (UTN FRVM) revisa los pull requests. No hagas merge de tu
propia rama. Si el cambio toca seguridad, privacidad del sufragio o cabeceras
CSP, mencionalo en la descripción.
