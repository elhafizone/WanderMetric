#!/usr/bin/env bash
# Copy content/offers into the plugin so the server can import them without
# WP-CLI (see includes/bundle-import.php). Run before deploying the plugin:
#
#   bash wordpress/bundle-offers.sh
#
# Writes data/offers/.bundle, a hash of every offer file; a new hash makes the
# site import new or changed offers once, in the background.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$REPO/wordpress/wp-content/plugins/wandermetric-core/data/offers"
rm -rf "$DEST"
mkdir -p "$DEST"
cd "$REPO/content/offers"
for d in */; do
  ls "$d"*.json >/dev/null 2>&1 || continue
  mkdir -p "$DEST/$d"
  cp "$d"*.json "$DEST/$d"
done
find "$DEST" -name '*.json' -type f | sort | xargs cat | md5sum | cut -d' ' -f1 > "$DEST/.bundle"
echo "bundled $(find "$DEST" -name '*.json' | wc -l) offers, hash $(cat "$DEST/.bundle")"
