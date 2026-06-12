# VOTAR — Frontend

Frontend del proyecto **VOTAR** (*Plataforma de Votación Electrónica con Tecnología Blockchain*), desarrollado como Proyecto Final de la carrera de Ingeniería en Sistemas de Información en la UTN FRVM.

Este repositorio contiene el **Panel de Administración** y la base de UI sobre la que se construirán también la Boleta Única Digital (BUD) y el Dashboard Público de resultados.

## Equipo Five Stack

| Integrante | Legajo |
|---|---|
| Liendo, Alejo | 15074 |
| Lucarelli, Bruno | 14988 |
| Magni, Gastón | 14991 |
| Mosconi, Ignacio (director) | 15288 |
| Terreno, Valentino | 15079 |

**Cátedra:** Proyecto Final ISI — Ing. Christian Villafañe, Ing. Matías Cassani

## Descripción

VOTAR es una plataforma **open source** para digitalizar procesos electorales de pequeña y mediana escala (centros de estudiantes, consejos directivos, empresas, cooperativas, sindicatos, organismos públicos), garantizando:

- Seguridad criptográfica
- Transparencia e inmutabilidad mediante blockchain
- Verificabilidad extremo a extremo (E2E)
- Anonimato del votante (desvinculación criptográfica identidad → voto)

**Caso piloto:** elecciones del Centro de Estudiantes (CEUTI) — UTN FRVM.

## Arquitectura del ecosistema

| Contenedor | Repositorio | Tecnología |
|---|---|---|
| Panel de Administración / BUD / Dashboard | `votar.front` (este repo) | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui |
| API Backend | [votar.back](https://github.com/PFISI-Votar/back) | NestJS 11, TypeORM, PostgreSQL 16 |
| Smart contracts | [blockchain](https://github.com/PFISI-Votar/blockchain) | Solidity, Ethereum Sepolia |

La documentación completa del proyecto (alcance, reglas de negocio, diagramas, lineamientos) se encuentra en la carpeta `Contexto/` del workspace académico.

## Stack tecnológico (frontend)

- **UI:** [shadcn/ui](https://ui.shadcn.com) (Tailwind CSS + Radix UI)
- **Build:** [Vite](https://vitejs.dev/)
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **Estado / datos:** [TanStack Query](https://tanstack.com/query/latest), [Zustand](https://zustand.docs.pmnd.rs/)
- **Formularios:** React Hook Form + Zod
- **HTTP:** Axios
- **Autenticación:** SSO institucional OAuth 2.0 / OIDC (integración pendiente con el backend)
- **Blockchain (cliente):** Ethers.js + Web Crypto API (billetera efímera)

## Requisitos previos

- Node.js 20+
- npm (incluido con Node.js)
- Backend `votar.back` en ejecución (para integración con la API)

## Instalación y ejecución

```bash
git clone https://github.com/PFISI-Votar/front.git
cd votar.front
npm install
cp .env.example .env
npm run dev
```

Variables de entorno disponibles:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend NestJS | `http://localhost:3000` |

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | ESLint |
| `npm run test` | Tests con Vitest (browser) |
| `npm run format` | Formateo con Prettier |

## Roles y módulos previstos

- **Autoridad Electoral:** configuración de comicios, gestión de padrón, publicación de Merkle Root, reportes
- **Votante:** emisión de sufragio vía BUD con firma criptográfica y recibo E2E
- **Auditor / Observador:** consulta del Dashboard Público de escrutinio en tiempo real

## Reglas de negocio clave

- Solo votantes empadronados pueden sufragar (validación vía Merkle Proof)
- Voto múltiple permitido; solo el **último** voto cuenta (`LAST_VOTE_WINS`)
- El voto no tiene relación persistente con la identidad del votante (Ley 25.326)
- La clave privada de la billetera efímera **nunca se persiste** en el cliente ni en el servidor
- Escrutinio público disponible en tiempo real sin autenticación

## Licencia

Proyecto académico open source — UTN FRVM, 2026.
