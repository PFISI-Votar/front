#!/bin/sh
# CLI wrapper for parity tests: sanitize one origin the same way the nginx
# entrypoint does. Prints the origin on success; exits 1 when rejected.
set -eu
# shellcheck source=csp-origin-lib.sh
. "$(dirname "$0")/csp-origin-lib.sh"

raw=$1
origin=$(to_csp_origin "$raw") || exit 1
is_allowed_connect_origin "$origin" || exit 1
printf '%s' "$origin"
