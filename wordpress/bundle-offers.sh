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
# Pre-downloaded partner images (for partners that refuse WordPress's downloader).
[ -d _images ] && cp -r _images "$DEST/_images"
for d in */; do
  [ "$d" = "_images/" ] && continue
  ls "$d"*.json >/dev/null 2>&1 || continue
  mkdir -p "$DEST/$d"
  cp "$d"*.json "$DEST/$d"
done
find "$DEST" -type f ! -name '.bundle' | sort | xargs cat | md5sum | cut -d' ' -f1 > "$DEST/.bundle"
echo "bundled $(find "$DEST" -name '*.json' | wc -l) offers, hash $(cat "$DEST/.bundle")"

# The fixed pages (includes/pages.php updates them when this hash changes).
PAGES="$REPO/wordpress/wp-content/plugins/wandermetric-core/data/pages"
rm -rf "$PAGES"
mkdir -p "$PAGES"
cp "$REPO/wordpress/content/pages/"*.html "$PAGES/"
find "$PAGES" -name '*.html' | sort | xargs cat | md5sum | cut -d' ' -f1 > "$PAGES/.bundle"
echo "bundled $(find "$PAGES" -name '*.html' | wc -l) pages, hash $(cat "$PAGES/.bundle")"

# Guides (includes/guides.php imports new or changed files when this hash changes).
GUIDES="$REPO/wordpress/wp-content/plugins/wandermetric-core/data/guides"
rm -rf "$GUIDES"
mkdir -p "$GUIDES"
if ls "$REPO/content/guides/"*.json >/dev/null 2>&1; then
  cp "$REPO/content/guides/"*.json "$GUIDES/"
  find "$GUIDES" -name '*.json' | sort | xargs cat | md5sum | cut -d' ' -f1 > "$GUIDES/.bundle"
fi
echo "bundled $(find "$GUIDES" -name '*.json' | wc -l) guides"
