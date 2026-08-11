# VOTAR — Frontend

Frontend del proyecto **VOTAR** (_Plataforma de Votación Electrónica con Tecnología Blockchain_), desarrollado como Proyecto Final de la carrera de Ingeniería en Sistemas de Información en la UTN FRVM.

Este repositorio contiene el **Panel de Administración** y la base de UI sobre la que se construirán también la Boleta Única Digital (BUD) y el Dashboard Público de resultados.

## Equipo Five Stack

| Integrante                  | Legajo |
| --------------------------- | ------ |
| Liendo, Alejo               | 15074  |
| Lucarelli, Bruno            | 14988  |
| Magni, Gastón               | 14991  |
| Mosconi, Ignacio (director) | 15288  |
| Terreno, Valentino          | 15079  |

**Cátedra:** Proyecto Final ISI — Ing. Christian Villafañe, Ing. Matías Cassani

## Descripción

VOTAR es una plataforma **open source** para digitalizar procesos electorales de pequeña y mediana escala (centros de estudiantes, consejos directivos, empresas, cooperativas, sindicatos, organismos públicos), garantizando:

- Seguridad criptográfica
- Transparencia e inmutabilidad mediante blockchain
- Verificabilidad extremo a extremo (E2E)
- Anonimato del votante (desvinculación criptográfica identidad → voto)

**Caso piloto:** elecciones del Centro de Estudiantes (CEUTI) — UTN FRVM.

## Estado del proyecto — v1.0.0 (MVP)

**Versión 1 — MVP: Elecciones en Blockchain Funcionales** (finales de julio de 2026).

Objetivo: elección funcional extremo a extremo. Alcance cubierto en esta versión:

- **Gestión electoral:** login de autoridad electoral, creación de comicio, categorías, listas y candidatos, importación de padrón CSV con validación de duplicados, apertura y cierre del comicio
- **Seguridad básica:** control de acceso por roles, login del votante, validación criptográfica de electores, voto en blanco
- **Votación:** firma criptográfica y transmisión segura del voto
- **Blockchain y auditoría mínima:** control de unicidad del sufragio (nullifier), eventos on-chain, dashboard público sin login
- **Verificabilidad:** recibo criptográfico de participación y verificador de voto E2E
- **Resultados:** visualización, exportación y métricas de participación

Además de lo planificado, esta versión incorpora funcionalidades adicionales no previstas originalmente para v1, como auditoría (audit log inmutable) y re-voto (política de último voto cuenta), entre otras.

## Estado del proyecto — v2.0.0

**Versión 2 — Dashboard público, re-voto y trazabilidad on-chain** (agosto de 2026).

Incremento post-MVP (Sprint 4). Alcance cubierto en esta versión:

- **Dashboard público:** estado técnico del smart contract, estadísticas de re-voto y transacciones on-chain (Urna Digital)
- **Configuración electoral:** voto nulo configurable por comicio e intervalo mínimo entre sufragios
- **Re-voto (BUD):** cooldown persistente entre recargas, reconciliación on-chain tras reload y mejoras UX en modales
- **Verificabilidad:** registro de transacciones públicas tras el cast y verificador de recibo por contrato Ballot por elección
- **Correcciones:** breadcrumbs, resultados en dashboard, comprobante de voto, pantallas BUD e integración Alchemy

## Arquitectura del ecosistema

| Contenedor                                | Repositorio                                             | Tecnología                                            |
| ----------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| Panel de Administración / BUD / Dashboard | `votar.front` (este repo)                               | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui |
| API Backend                               | [votar.back](https://github.com/PFISI-Votar/back)       | NestJS 11, TypeORM, PostgreSQL 16                     |
| Smart contracts                           | [blockchain](https://github.com/PFISI-Votar/blockchain) | Solidity, Ethereum Sepolia                            |

La documentación completa del proyecto (alcance, reglas de negocio, diagramas, lineamientos) se encuentra en la carpeta `Contexto/` del workspace académico.

## Stack tecnológico (frontend)

- **UI:** [shadcn/ui](https://ui.shadcn.com) (Tailwind CSS + Radix UI)
- **Build:** [Vite](https://vitejs.dev/)
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **Estado / datos:** [TanStack Query](https://tanstack.com/query/latest), [Zustand](https://zustand.docs.pmnd.rs/)
- **Formularios:** React Hook Form + Zod
- **HTTP:** Axios
- **Autenticación:** SSO institucional vía BFF Autogestión (votante y admin); cookie HttpOnly separada por rol
- **Blockchain (cliente):** `@noble/secp256k1` + Web Crypto API (billetera efímera) + `viem` (EIP-712 typed data)

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

| Variable       | Descripción                 | Valor por defecto       |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | URL base del backend NestJS | `http://localhost:8000` |

## Login del votante (BUD — US-312)

Ruta pública: `/comicios/{idEleccion}/votar`

1. El votante ingresa legajo y clave de **Autogestión UTN** (no usar `/sign-in` del panel admin).
2. El backend valida credenciales, comprueba padrón (`hash(dni:email)`) y emite JWT `role=voter` en cookie `votar_voter_access_token` (30 min, sin refresh).

## Scripts disponibles

| Comando           | Descripción                |
| ----------------- | -------------------------- |
| `npm run dev`     | Servidor de desarrollo     |
| `npm run build`   | Build de producción        |
| `npm run preview` | Vista previa del build     |
| `npm run lint`    | ESLint                     |
| `npm run test`    | Tests con Vitest (browser) |
| `npm run format`  | Formateo con Prettier      |

## Deploy y cabeceras de seguridad (VOTAR-381)

El build estático se despliega con Docker/nginx. Ver [deploy/README.md](./deploy/README.md) para variables, HSTS detrás de TLS y sincronización de CSP con `src/config/security-headers.ts`.

```bash
npm run generate:nginx-security-headers   # regenerar snippet nginx desde el módulo TS
npm run verify:security-headers           # validar headers en Vite preview
```

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
