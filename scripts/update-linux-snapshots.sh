#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

export REVISION=${revision}

compose="docker-compose -f docker-compose.yml -f docker-compose-playwright.yml"

function cleanup {
  echo "Cleaning up..."
  $compose down
}

trap cleanup EXIT

echo "Building playwright Docker image..."
docker build -t playwright-image -f Dockerfile.playwright-test-runner --build-arg "PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION}" .

echo "Building VA service image..."
$compose build va

echo "Starting services..."
$compose up -d va

echo "Waiting for VA service to be healthy (this may take up to 2 minutes)..."
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if $compose ps va | grep -q "healthy"; then
    echo "VA service is healthy!"
    break
  fi
  echo "Waiting... ($elapsed/$timeout seconds)"
  sleep 5
  elapsed=$((elapsed + 5))
done

if [ $elapsed -ge $timeout ]; then
  echo "Error: VA service did not become healthy within $timeout seconds"
  $compose logs va
  exit 1
fi

echo "Updating snapshots in Linux container..."
echo "Running snapshot tests only:"
echo "  - hakulomake/look-and-feel.test.ts"
echo "  - ruotsinkielinen-hakija-paatos.test.ts"
echo "  - hakemuksen-arviointi/paatos.liitteet.test.ts"
echo "  - jotpa/jotpa-hakemuksen-tayttaminen.test.ts"
echo ""

docker run --rm --network valtionavustus-playwright_default \
  -v "$(pwd)/playwright-results":/playwright-results \
  -v "$(pwd)/playwright":/playwright \
  --init --ipc=host \
  --env TZ='Europe/Helsinki' \
  --env VIRKAILIJA_HOSTNAME=va \
  --env HAKIJA_HOSTNAME=va \
  --env HEADLESS=true \
  --entrypoint /usr/bin/npx \
  playwright-image \
  playwright test \
  --config=playwright/playwright.config.ts \
  --project=Default \
  --update-snapshots \
  -- \
  hakulomake/look-and-feel.test.ts \
  ruotsinkielinen-hakija-paatos.test.ts \
  hakemuksen-arviointi/paatos.liitteet.test.ts \
  jotpa/jotpa-hakemuksen-tayttaminen.test.ts \
  "$@" || {
    echo "Error: Playwright snapshot update failed"
    echo "Check logs above for details"
    exit 1
  }

echo "Done! Linux snapshots updated."
