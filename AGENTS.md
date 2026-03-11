# Repository Guidelines

## Project Structure & Module Organization
- `va-hakija/` and `va-virkailija/` are Leiningen apps for applicant and official UIs; both serve front-end assets from their `web/va` trees and rely on shared form logic in `soresu-form/`.
- `server/` contains the common Clojure backend (REST APIs, database integrations, tests under `server/spec`). Supporting services live in `maksatuspalvelu/` and infrastructure definitions live in `cdk/` and `deploy-scripts/`.
- UI regression packs, configs, and fixtures are in `playwright/`; local orchestration scripts sit in `scripts/` alongside `start-local-env.sh` and Docker Compose files for dev containers.

## Build, Test, and Development Commands
- `./start-local-env.sh` spins up tmux panes that build frontends, run the VA service stack, fakes SMTP, maksatuspalvelu, and pagerduty containers.
- `npm run build` (or `build-watch`) bundles front-end assets for both UIs; run inside each service directory when editing JS/TS.
- `../lein with-profile test spec -f d` (from within a service dir) executes Speclj unit/integration suites once; add `-a` to watch.
- `npm run playwright:test` executes end-to-end checks with the repo Playwright config; choose `:smoketest-qa` or `:smoketest-prod` before promoting changes.

## Coding Style & Naming Conventions
- Clojure code follows idiomatic two-space indentation and kebab-case namespaces; format with `lein cljfmt fix` before committing.
- TypeScript/JavaScript code uses Prettier defaults (`npm run prettier-check-project`); React components favor PascalCase files, hooks remain camelCase, and CSS modules mirror component names.
- Keep Docker, script, and YAML files POSIX-compliant with lower-case, hyphenated filenames.

## Agent Gotchas
- DB result keys from `oph.soresu.common.db/query` are converted from snake_case to kebab-case. Read result maps with keys like `:hakemus-id`, `:organization-name`, `:contact-person` (not `:hakemus_id`, `:organization_name`, `:contact_person`).
- Real failure seen in VA-477: using underscore keys in `server/src/clojure/oph/va/virkailija/db.clj` caused `java.sql.BatchUpdateException` during muutoshakemus decision save (`POST .../muutoshakemus/:id/paatos`).
- CI Playwright tests run inside `Dockerfile.playwright-test-runner`, not directly from repo tree. If a unit test imports code from `va-hakija/`, the image must copy `va-hakija/` and root `tsconfig.json` + `common-tsconfig.json`; otherwise CI fails with `Cannot find module ...` (seen in VA-477 follow-up with `playwright/tests/unit-tests/muutoshakemusClient.test.ts`).

## Testing Guidelines
- Add or update Speclj specs next to the namespaces they cover in each `spec/` directory; prefer descriptive `describe` blocks over long test names.
- Playwright specs live under `playwright/tests`; name files by feature (`application-submission.spec.ts`) and capture new fixtures in `playwright/fixtures`.
- E2E runs require frontends built via `npm run build` and a running local stack; rely on `docker-compose.local-dev.yml` for dependencies.

## Commit & Pull Request Guidelines
- Follow the existing sentence-style summaries (`Update dependency aws-cdk-lib to v2.217.0`); start with an imperative verb and avoid trailing punctuation.
- Reference Jira or GitHub issues in the body when applicable, and mention any migrations or manual steps.
- Pull requests should state scope, test evidence (commands run, screenshots for UI), and note coordination needed with `valtionavustus-secret`.

## Security & Configuration Tips
- Secrets live in the adjacent `valtionavustus-secret/` repo; never commit credentials here and rely on the provided Docker Compose overrides for local secrets.
- Regenerate `tmp/version.txt` via the startup script only—do not hand-edit generated files.
