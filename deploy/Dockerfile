FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3000
ARG VITE_RPC_URL=
ARG VITE_RPC_FALLBACK_URLS=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RPC_URL=${VITE_RPC_URL}
ENV VITE_RPC_FALLBACK_URLS=${VITE_RPC_FALLBACK_URLS}

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY deploy/nginx/security-headers.conf.template /etc/nginx/templates/security-headers.conf.template
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

ENV API_ORIGIN=http://localhost:3000
ENV RPC_ORIGINS=

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
