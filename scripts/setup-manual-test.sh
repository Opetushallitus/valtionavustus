#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Seed manual-test state by running a real Playwright test up to a chosen point.
# The matching test prints the links you need and returns early (see
# playwright/utils/setupLinks.ts). The created state persists in the local dev DB,
# so you can open the printed links in your normal browser.
#
# Usage: ./scripts/setup-manual-test.sh <scenario>

repo_root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$repo_root"
# shellcheck source=scripts/common-functions.sh
source "$repo_root/scripts/common-functions.sh"

scenario="${1:-}"
case "$scenario" in
  hakemus)
    file="tests/hakulomake/look-and-feel.test.ts"
    title="Hakemuksen ulkoasu"
    ;;
  muutoshakemus)
    file="tests/muutoshakemus/muutoshakemus-happy-path.test.ts"
    title="When muutoshakemus enabled haku has been published"
    ;;
  yhteishanke-muutoshakemus)
    file="tests/yhteishanke/yhteishanke-osapuolimuutokset.test.ts"
    title="yhteishanke osapuolimuutos updates recipients"
    ;;
  paatos)
    file="tests/hakemuksen-arviointi/loppuselvitys/virkailija-can-accept-loppuselvitys.test.ts"
    title="hyväksymis sähköposti autotäydentää"
    ;;
  *)
    echo "Usage: $0 <scenario>"
    echo "Scenarios: hakemus, muutoshakemus, yhteishanke-muutoshakemus, paatos"
    exit 1
    ;;
esac

# Seeders need the local dev environment running (same as the test suite).
if ! curl --silent --fail --max-time 5 http://localhost:8081/api/healthcheck > /dev/null 2>&1; then
  echo "ERROR: dev environment is not running (http://localhost:8081/api/healthcheck unreachable)."
  echo "Start it first with: task dev"
  exit 1
fi

init_nodejs

# Playwright suppresses test stdout by default, so the seeder writes the links to this
# file (see playwright/utils/setupLinks.ts) and we print it after the run.
links_file="$(mktemp "${TMPDIR:-/tmp}/setup-links.XXXXXX")"
trap 'rm -f "$links_file"' EXIT

SETUP_LINKS="$scenario" SETUP_LINKS_OUTPUT="$links_file" npx playwright test \
  --config=playwright/playwright.config.ts \
  --project=Default \
  "$file" -g "$title" \
  --workers=1 --retries=0 --reporter=list

if [ -s "$links_file" ]; then
  cat "$links_file"
else
  echo "WARNING: no setup links were captured (did the seeder reach the breakpoint?)." >&2
  exit 1
fi
