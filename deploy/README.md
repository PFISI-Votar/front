# Deploy estático (Docker + nginx)

Imagen nginx que sirve el build de Vite con cabeceras de seguridad de VOTAR-381.

## Build y ejecución

```bash
docker build -f deploy/Dockerfile \
  --build-arg VITE_API_URL=https://api.ejemplo.test \
  -t votar-front .

docker run --rm -p 8080:80 \
  -e API_ORIGIN=https://api.ejemplo.test \
  votar-front
```

| Variable       | Descripción                                      | Default                 |
| -------------- | ------------------------------------------------ | ----------------------- |
| `API_ORIGIN`   | Origen del backend en CSP (`connect-src`, `img-src`) | `http://localhost:3000` |
| `RPC_ORIGINS`  | Orígenes RPC en CSP (`connect-src`), separados por espacio (VOTAR-386) | vacío |

## Cabeceras de seguridad

Las directivas nginx se **generan** desde `src/config/security-headers.ts` para evitar drift con Vite preview/dev:

```bash
npm run generate:nginx-security-headers
```

El archivo resultante es `deploy/nginx/security-headers.conf.template`. No editarlo a mano; el CI falla si queda desincronizado (`npm run verify:nginx-security-headers`).

`default.conf.template` incluye ese snippet en el bloque `server` y en el `location` de assets estáticos (`.js`, `.css`, `.woff2`, imágenes). En nginx, cualquier `add_header` en un `location` reemplaza los del padre; por eso el snippet se repite en ambos niveles.

## HSTS en puerto 80

El contenedor escucha en **:80** y envía `Strict-Transport-Security`. Eso es correcto cuando nginx está **detrás de un terminador TLS** (reverse proxy, load balancer o CDN) que termina HTTPS hacia el cliente.

No exponer este contenedor directamente a Internet sin HTTPS delante: los clientes que lleguen por HTTP no deben confiar solo en HSTS emitido en una respuesta HTTP plana.

## UAT-01 (Lighthouse)

Antes de cerrar VOTAR-381 en Jira, ejecutar Lighthouse en **staging HTTPS** (categorías Security y Best Practices) y adjuntar la evidencia en el ticket. El CI valida headers en Vite preview; Lighthouse en staging confirma el comportamiento en el entorno real.

## Checklist de verificación manual

- [ ] `curl -I https://staging/.../assets/*.js` incluye CSP, X-Frame-Options, HSTS, Permissions-Policy y Referrer-Policy
- [ ] Lighthouse Security ≥ objetivo del equipo en staging HTTPS
- [ ] `API_ORIGIN` apunta al backend correcto en el entorno desplegado
