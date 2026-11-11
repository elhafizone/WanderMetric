#!/usr/bin/env bash
# Link this repo's theme and plugin into a Local (localwp.com) site, activate
# them, and import the offers. Run from Git Bash after creating the site in
# Local and pressing "Start site".
#
#   bash wordpress/setup-local.sh [site-name] [--publish]
#
# Uses the system PHP (8.1+, with mysqli) and Local's bundled WP-CLI, pointed
# at the site's own MySQL port read from Local's sites.json.
set -euo pipefail

SITE="${1:-wandermetric}"
PUBLISH="${2:-}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WP_PHAR="$LOCALAPPDATA/Programs/local/resources/extraResources/bin/wp-cli/wp-cli.phar"

IFS=$'\t' read -r SITE_PATH DB_PORT < <(node -e '
  const s = require(process.env.APPDATA + "/Local/sites.json");
  const site = Object.values(s).find((x) => x.name === process.argv[1]);
  if (!site) { console.error("No Local site named " + process.argv[1]); process.exit(1); }
  const db = site.services.mysql || site.services.mariadb;
  console.log(site.path.replace(/^~/, process.env.USERPROFILE) + "\t" + db.ports.MYSQL[0]);
' "$SITE")

PUBLIC="$SITE_PATH/app/public"
[ -f "$PUBLIC/wp-config.php" ] || { echo "WordPress not found at $PUBLIC"; exit 1; }

wp() { php -d "mysqli.default_port=$DB_PORT" -d memory_limit=512M "$WP_PHAR" --path="$PUBLIC" "$@"; }

link() { # Windows junction, so edits in the repo show up in the site at once
  local target="$1" link="$2"
  [ -e "$link" ] && { echo "exists: $link"; return; }
  cmd //c mklink //J "$(cygpath -w "$link")" "$(cygpath -w "$target")" >/dev/null
  echo "linked: $link"
}

link "$REPO/wordpress/wp-content/themes/wandermetric" "$PUBLIC/wp-content/themes/wandermetric"
link "$REPO/wordpress/wp-content/plugins/wandermetric-core" "$PUBLIC/wp-content/plugins/wandermetric-core"

wp plugin activate wandermetric-core
wp theme activate wandermetric
wp option update blogname "WanderMetric"
wp option update blogdescription "Read before you book"
wp rewrite structure '/news/%postname%'
wp rewrite flush

wp wandermetric import "$REPO/content/offers" \
  --assets="$REPO/public" \
  --legacy-list="$REPO/scripts/lib/visual-policy.mjs" \
  ${PUBLISH:+--publish}

echo "Done: $(wp option get home)"
