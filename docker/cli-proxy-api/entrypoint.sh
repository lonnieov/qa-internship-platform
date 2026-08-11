#!/bin/sh
# Renders config.yaml from the checked-in base config plus the api-keys list,
# because CLIProxyAPI's YAML loader does not expand ${VAR} placeholders itself.
set -e

: "${CLI_PROXY_API_KEY:?CLI_PROXY_API_KEY must be set}"

CONFIG_OUT=/CLIProxyAPI/config.yaml

cat /CLIProxyAPI/config.base.yaml > "$CONFIG_OUT"
{
  echo ""
  echo "api-keys:"
  echo "  - \"${CLI_PROXY_API_KEY}\""
} >> "$CONFIG_OUT"

exec /CLIProxyAPI/CLIProxyAPI --config "$CONFIG_OUT" "$@"
