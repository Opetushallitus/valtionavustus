# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Valtionavustukset is OPH's (Finnish National Agency for Education) grant application system. It consists of two main web services (va-hakija and va-virkailija) sharing common code in soresu-form, built with Clojure backend and TypeScript/React frontend.

### Key Concepts

- **Hakija** (Applicant): User who submits a grant application (no authentication required)
- **Haku/Avustushaku** (Grant call): An open funding opportunity with a form that applicants fill out
- **Hakemus** (Application): Grant application submitted by an applicant for a specific grant call
- **Asianumero** (Case number): Archive identifier - multiple grant calls can share the same case number

### User Roles

**Virkailija roles** (authenticated via OPH CAS):
- **VA-käyttäjä** (Normal user): Can read all applications, edit/evaluate grants where they have specific roles
- **VA-pääkäyttäjä** (Admin): Can read and edit all grants and applications

**Grant-specific roles**:
- **Esittelijä** (Presenter): Primary responsible for the grant, manages applications and funding distribution
- **Arvioija** (Evaluator): Supporting role, can evaluate and modify parts of funding decisions

### Application States

From applicant perspective:
- uusi (new), luonnos (draft), lähetetty (submitted), odottaa täydennystä (awaiting completion), poistettu (deleted)

From virkailija perspective:
- käsittelemättä (unprocessed), käsittelyssä (processing), mahdollinen (possible), hylätty (rejected - final), hyväksytty (approved - final)

## Architecture

### Project Structure

This is a **monorepo** with shared code. Both services (va-hakija and va-virkailija) share the same backend codebase but serve different frontends.

- **server/** - Clojure backend code (single Leiningen project for both services)
  - `server/src/clojure/oph/va/hakija/` - Applicant service backend
  - `server/src/clojure/oph/va/virkailija/` - Official service backend
  - `server/src/clojure/oph/soresu/` - Shared form library backend
  - `server/src/clojure/oph/common/` - Common utilities
  - `server/config/` - Environment-specific EDN configuration files
  - `server/spec/` - Clojure tests using speclj

- **va-hakija/** - Applicant frontend (public-facing)
  - `va-hakija/web/va/` - React/TypeScript components

- **va-virkailija/** - Official frontend (authenticated)
  - `va-virkailija/web/va/` - React/TypeScript components

- **soresu-form/** - Shared frontend form library
  - `soresu-form/web/` - Common React components and utilities
  - Changes here affect both va-hakija and va-virkailija

- **maksatuspalvelu/** - Payment service
- **cdk/** - AWS CDK infrastructure definitions
- **playwright/** - E2E test suites

### Key Technologies

- **Backend**: Clojure 1.12.3, Leiningen 2.11.2
- **Frontend**: React 19.2.3, TypeScript 5.9.3, Webpack 5
- **Database**: PostgreSQL 18.1 (with Flyway migrations)
- **Testing**: Speclj (Clojure), Playwright (E2E)
- **Server**: http-kit
- **Routing**: Compojure/compojure-api

### Services

Both services run from the same main entry point (`oph.va.hakija.main`) but expose different APIs:
- **va-hakija** (port 8080): Public grant application submission
- **va-virkailija** (port 8081): Grant evaluation and management (CAS authenticated)

## Development Setup

### Prerequisites

- Node.js 24.13.0 (see `.nvmrc`)
- Leiningen 2.11.2 (use included `./lein` script)
- Java 8
- PostgreSQL 18+ or Docker
- Docker and Docker Compose
- tmux (for `start-local-env.sh` script)

### Database

Using Docker Compose (recommended):
```bash
docker compose up db
```

Manual restore from backup:
```bash
pg_restore --user va -h localhost -v --clean --if-exists --no-acl --no-owner --dbname va-dev ./valtionavustukset-2.backup
```

### Frontend Development

Build frontend assets (run in separate terminals):
```bash
# Hakija
cd va-hakija
npm run build-watch

# Virkailija
cd va-virkailija
npm run build-watch
```

Or build all at once from root:
```bash
npm run build         # Production build
npm run build-watch   # Watch mode
```

### Backend Development

Run backend (migrations run automatically on startup):
```bash
./lein with-profile server-local run -m oph.va.hakija.main
```

### Testing

**Backend tests** (uses speclj):
```bash
./lein with-profile test spec -f d        # Run all tests once
./lein with-profile test spec -a          # Watch mode (re-run on changes)
./lein with-profile test spec -a -t tag   # Run only tests tagged with 'tag'
```

**Running tests for a specific namespace:**
Tests are in `server/spec/` directory. Run from project root:
```bash
./lein with-profile test spec -f d server/spec/oph/va/hakija/api_spec.clj
```

Important: **va-virkailija tests require va-hakija tests to have been run first** due to shared test data setup.

**Frontend unit tests** are included in backend test runs.

**Playwright E2E tests**:
```bash
npm run playwright:test
```

**Linting**:
```bash
npm run prettier-check-project   # Check formatting
npm run prettier-fix             # Fix formatting
./lein cljfmt check              # Check Clojure formatting
./lein cljfmt fix                # Fix Clojure formatting
```

### Docker Compose

Full local development environment with tmux (recommended):
```bash
./start-local-env.sh
```

This script starts a tmux session with 6 panes running:
1. Database (PostgreSQL)
2. Frontend build (webpack watch)
3. VA server (hakija + virkailija)
4. FakeSMTP (email testing)
5. Maksatuspalvelu
6. PagerDuty mock

Manual Docker Compose (without tmux):
```bash
docker compose -f docker-compose.yml -f docker-compose.local-dev.yml up
```

## Common Tasks

### Generate Test Applications

```bash
cd va-hakija
../lein populate 400
```

### Running Single Service Profile

Use Leiningen profiles to configure environment:
```bash
./lein with-profile server-local run -m oph.va.hakija.main
./lein with-profile test trampoline run
```

Available profiles: `server-local`, `server-test`, `test`, `test-legacy`

### Configuration

Configuration is layered via EDN files in `server/config/`:
- `defaults.edn` - Default configuration
- `local.edn` - Local development overrides
- `test.edn` - Test environment
- Environment-specific: `aws-dev.edn`, `aws-qa.edn`, `aws-prod.edn`

Secrets are stored separately in `../valtionavustus-secret/config/secret-dev.edn`

### Database Migrations

Migrations are in `server/resources/db/migration/` and run automatically on server startup via Flyway.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `build-master.yaml` - Build on master
- `run-tests-on-pr.yaml` - PR validation
- Build pipeline runs:
  1. `01-build.sh` - Build Docker image
  2. `02-other-tests.sh` - Run speclj and CDK tests
  3. `03-playwright-tests.sh` - E2E tests (sharded 1-6)
  4. `04-lint.sh` - Prettier and cljfmt checks

## Interactive Development (REPL)

Leiningen uses checkout dependencies for soresu-form and common libraries, enabling live code reloading.

### Connecting to Running REPL

The backend server runs an nREPL server on port 7999 (inside the Docker container). Connect to it:

```bash
./lein repl :connect localhost:7999
```

Or use the convenience script:
```bash
./repl-connect.sh
```

### Modifying Code via REPL

You can modify running code without restarting the server - this is one of the most powerful features of Clojure development:

**Interactive approach:**
```clojure
;; 1. Switch to the namespace you want to modify
(in-ns 'oph.va.virkailija.routes)

;; 2. Redefine a function
(defn- on-healthcheck []
  (log/info "Modified via REPL!")
  (if (virkailija-db/health-check)
    (ok {:status "healthy" :modified-via "repl"})
    (not-found)))

;; The function is now updated in the running application!
```

**Non-interactive (scripted) approach:**
```bash
cat << 'EOF' | ./lein repl :connect localhost:7999
(in-ns 'oph.va.virkailija.routes)
(defn- my-function []
  (println "Updated function"))
(println "Function updated!")
EOF
```

**Important considerations:**
- Changes made via REPL are **not persisted** to source files
- After testing in REPL, remember to update the actual source files
- REPL changes are lost when the server restarts
- Changing soresu/common code requires re-evaluating dependent namespaces
- Private functions (defined with `defn-`) can still be redefined via REPL

### CIDER (Emacs) Setup

For CIDER (Emacs):
1. Set `(customize-set-variable 'cider-prompt-for-symbol nil)`
2. Add to `~/.lein/profiles.clj`:
   ```clojure
   {:repl {:plugins [[cider/cider-nrepl "0.15.1"]]
           :dependencies [[org.clojure/tools.nrepl "0.2.13"]]}}
   ```
3. Open a .clj file and run `cider-jack-in`
4. In REPL: `(def main (-main))`

Changes to soresu/common code can be evaluated and will reflect immediately in the running application.

## Webpack Configuration

Shared webpack config (`webpack.config.js`) builds both applications with:
- TypeScript and JSX transpilation
- LESS/CSS module support
- Code splitting (soresu-form code split into commons chunk)
- Outputs to `server/resources/public/{hakija,virkailija}/js/`

Entry points:
- **Hakija**: VaApp.tsx, SelvitysApp.tsx, VaLogin.tsx, MuutoshakemusApp.tsx
- **Virkailija**: HakemustenArviointiApp.tsx, HakujenHallintaApp.tsx, YhteenvetoApp.jsx, Login.jsx, KoodienhallintaApp.tsx, SearchApp.tsx

## Code Style

### Language Policy - Finnish in Code

**IMPORTANT**: This codebase uses **Finnish language** for domain-specific function names, variables, and database columns. This is a **requirement**, not a mistake.

- Domain terms (hakija, hakemus, avustushaku, virkailija, etc.) must remain in Finnish
- Function names handling domain concepts should use Finnish terms
- Database columns and table names use Finnish
- **Do NOT translate** Finnish domain terms to English - this adds confusion
- The domain is highly Finland-specific and Finnish language is required for developers

Examples of correct naming:
```clojure
(defn hae-hakemus [hakemus-id] ...)           ; ✓ Correct
(defn get-application [application-id] ...)   ; ✗ Wrong - don't translate

(def avustushaku-id ...)                      ; ✓ Correct
(def grant-call-id ...)                       ; ✗ Wrong
```

General technical terms (e.g., "user", "session", "token") can remain in English.

### Clojure
- Follow idiomatic two-space indentation and kebab-case namespaces
- Run `./lein cljfmt fix` before committing
- Pedantic dependency checking is enabled (`:pedantic? :abort`) - all dependency versions must be explicit

### TypeScript/JavaScript
- Use Prettier defaults: `npm run prettier-check-project` to check, `npm run prettier-fix` to fix
- React components use PascalCase filenames
- Hooks and utilities use camelCase
- CSS modules mirror component names

## Commit Guidelines

- Use sentence-style summaries with imperative verbs (e.g., "Update dependency aws-cdk-lib to v2.217.0")
- No trailing punctuation in commit messages
- Reference Jira/GitHub issues in commit body when applicable
- Mention any required migrations or coordination with `valtionavustus-secret` repo

## Important Notes

- Backend tests include frontend unit test execution
- **va-virkailija tests require va-hakija tests to have been run first**
- Use `./lein` script to ensure consistent Leiningen version (2.11.2)
- Project expects `valtionavustus-secret` repo as **sibling directory** for secrets
- Secrets are loaded from `../valtionavustus-secret/config/secret-dev.edn`
- Main branch is `master`
- Both services (hakija + virkailija) run from single backend in `server/` directory
