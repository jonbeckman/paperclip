#!/bin/sh
set -eu

paperclip_home="${PAPERCLIP_HOME:-/paperclip}"

case "$paperclip_home" in
  "~")
    paperclip_home="${HOME:-/paperclip}"
    ;;
  "~/"*)
    paperclip_home="${HOME:-/paperclip}/${paperclip_home#~/}"
    ;;
esac

if [ -z "$paperclip_home" ] || [ "$paperclip_home" = "/" ]; then
  echo "Refusing to initialize PAPERCLIP_HOME='$paperclip_home'" >&2
  exit 1
fi

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$paperclip_home"
  chown -R node:node "$paperclip_home"
  exec gosu node "$@"
fi

mkdir -p "$paperclip_home"
exec "$@"
