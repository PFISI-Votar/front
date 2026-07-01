#!/bin/sh
set -eu

API_ORIGIN="${API_ORIGIN:-http://localhost:3000}"
export API_ORIGIN

envsubst '${API_ORIGIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
