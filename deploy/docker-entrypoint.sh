#!/bin/sh
set -eu

# Mirror src/config/security-headers.ts toCspOrigin + isAllowedConnectOrigin
# (production). envsubst alone would paste raw RPC URLs (with API keys) into CSP.

to_csp_origin() {
  raw=$1
  scheme=
  rest=

  case "$raw" in
    https://*)
      scheme=https
      rest=${raw#https://}
      ;;
    http://*)
      scheme=http
      rest=${raw#http://}
      ;;
    *)
      return 1
      ;;
  esac

  case "$rest" in
    *@*) rest=${rest#*@} ;;
  esac

  host=${rest%%[/?#]*}
  if [ -z "$host" ]; then
    return 1
  fi

  printf '%s://%s' "$scheme" "$host"
}

is_loopback_origin() {
  origin=$1
  hostport=${origin#*://}
  case "$hostport" in
    \[*\])
      host=$hostport
      ;;
    \[*\]:*)
      # [::1]:8545 — strip port after the closing bracket (not %%:* which
      # would truncate inside the brackets).
      host=${hostport%:*}
      ;;
    *:*)
      host=${hostport%%:*}
      ;;
    *)
      host=$hostport
      ;;
  esac
  case "$host" in
    localhost|127.0.0.1|\[::1\]|::1) return 0 ;;
    *) return 1 ;;
  esac
}

is_allowed_connect_origin() {
  origin=$1
  case "$origin" in
    https://*) return 0 ;;
    http://*)
      if is_loopback_origin "$origin"; then
        return 0
      fi
      return 1
      ;;
    *) return 1 ;;
  esac
}

sanitize_api_origin() {
  raw=$1
  origin=$(to_csp_origin "$raw") || {
    echo "API_ORIGIN must be an absolute http(s) URL (got: $raw)" >&2
    exit 1
  }
  is_allowed_connect_origin "$origin" || {
    echo "API_ORIGIN is not allowed in production CSP (got: $origin)" >&2
    exit 1
  }
  printf '%s' "$origin"
}

sanitize_rpc_origins() {
  raw=$1
  result=
  # Intentionally unquoted: RPC_ORIGINS is space-separated.
  # shellcheck disable=SC2086
  for token in $raw; do
    [ -z "$token" ] && continue
    origin=$(to_csp_origin "$token") || {
      echo "RPC_ORIGINS entry must be an absolute http(s) URL (got: $token)" >&2
      exit 1
    }
    is_allowed_connect_origin "$origin" || {
      echo "RPC_ORIGINS entry is not allowed in production CSP (got: $origin)" >&2
      exit 1
    }
    if [ -z "$result" ]; then
      result=$origin
    else
      case " $result " in
        *" $origin "*) ;;
        *) result="$result $origin" ;;
      esac
    fi
  done
  printf '%s' "$result"
}

API_ORIGIN="$(sanitize_api_origin "${API_ORIGIN:-http://localhost:3000}")"
RPC_ORIGINS="$(sanitize_rpc_origins "${RPC_ORIGINS:-}")"
export API_ORIGIN
export RPC_ORIGINS

mkdir -p /etc/nginx/snippets

envsubst '${API_ORIGIN} ${RPC_ORIGINS}' < /etc/nginx/templates/security-headers.conf.template > /etc/nginx/snippets/security-headers.conf
envsubst '${API_ORIGIN} ${RPC_ORIGINS}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
