#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Builds playwright-results/hakija-translations.xlsx (translations + embedded element screenshots).
# Run the specs in playwright/tests/translation-screenshots first to fill in the screenshots.
# Usage: ./scripts/translations-excel/run.sh [output.xlsx]   (path relative to repo root; it is written via a container mount)

repo_root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." && pwd )"
image="va-translations-excel"

docker build --quiet --tag "$image" "$repo_root/scripts/translations-excel" > /dev/null
docker run --rm --volume "$repo_root:/repo" --workdir /repo "$image" \
  server/resources/public/translations.json \
  soresu-form/web/va/i18n/translations.ts \
  playwright-results/translation-screenshots \
  "${1:-playwright-results/hakija-translations.xlsx}"
