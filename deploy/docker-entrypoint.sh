#!/bin/sh
set -eu

API_ORIGIN="${API_ORIGIN:-http://localhost:3000}"
RPC_ORIGINS="${RPC_ORIGINS:-}"
export API_ORIGIN
export RPC_ORIGINS

mkdir -p /etc/nginx/snippets

envsubst '${API_ORIGIN} ${RPC_ORIGINS}' < /etc/nginx/templates/security-headers.conf.template > /etc/nginx/snippets/security-headers.conf
envsubst '${API_ORIGIN} ${RPC_ORIGINS}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
