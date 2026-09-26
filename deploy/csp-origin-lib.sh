#!/bin/sh
# Shared CSP origin sanitization for nginx deploy.
# Mirrors src/config/security-headers.ts (toCspOrigin + isAllowedConnectOrigin
# in production). Sourced by docker-entrypoint.sh and parity tests.

# Host(+optional port) whitelist — rejects ; " newlines and other CSP
# directive injectors. DNS / IPv4 / localhost, or bracketed IPv6, optional
# :1–5 digit port (must be ≤ 65535).
is_strict_csp_hostport() {
  hostport=$1
  # grep is line-oriented: reject newlines / metacharacters before matching.
  # ] must be first in the negated class so it is literal (POSIX).
  case "$hostport" in
    *[!\]a-z0-9.:[-]*) return 1 ;;
  esac

  printf '%s' "$hostport" | grep -Eiq \
    '^(localhost|([a-z0-9-]+\.)*[a-z0-9-]+)(:[0-9]{1,5})?$|^\[([0-9a-f:]+)\](:[0-9]{1,5})?$' \
    || return 1

  port=
  case "$hostport" in
    \[*\]:*) port=${hostport##*:} ;;
    \[*\]) port= ;;
    *:*) port=${hostport##*:} ;;
  esac
  if [ -n "$port" ]; then
    case "$port" in
      *[!0-9]*) return 1 ;;
    esac
    if [ "$port" -gt 65535 ]; then
      return 1
    fi
  fi
  return 0
}

to_csp_origin() {
  # Lowercase the whole value so HTTPS:// matches and host casing is normalized
  # the same way URL() does. Paths/queries are discarded after authority extract.
  raw=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
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

  # Authority only (before path/query/fragment). Strip userinfo from authority
  # alone — never from a later '@' in a query (e.g. ?ref=a@b).
  authority=${rest%%[/?#]*}
  case "$authority" in
    *@*) hostport=${authority#*@} ;;
    *) hostport=$authority ;;
  esac

  if [ -z "$hostport" ]; then
    return 1
  fi

  is_strict_csp_hostport "$hostport" || return 1

  printf '%s://%s' "$scheme" "$hostport"
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
