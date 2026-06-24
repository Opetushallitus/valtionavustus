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

- **Backend**: Clojure + Leiningen (versions in `project.clj` and the `lein` script)
- **Frontend**: React + TypeScript + Webpack 5 (versions in `package.json`)
- **Database**: PostgreSQL with Flyway migrations (version in `docker-compose.yml`)
- **Server**: http-kit
- **Routing**: Compojure/compojure-api

### Services

Both services run from the same main entry point (`oph.va.hakija.main`) but expose different APIs:
- **va-hakija** (port 8080): Public grant application submission
- **va-virkailija** (port 8081): Grant evaluation and management (CAS authenticated)

## Development Setup

### Prerequisites

Docker runs the backend, database, and supporting services, so their toolchain (Java, Leiningen, PostgreSQL) isn't needed on the host.

**Required (`task dev`):**
- Docker and Docker Compose
- [Task](https://taskfile.dev/) (go-task) — runs the dev environment and tests
- tmux — `start-local-env.sh` uses a tmux session
- Node.js — for the host-side webpack build and Playwright; auto-installed from `.nvmrc` by the dev scripts

**Optional (backend outside Docker, or REPL/IDE):**
- OpenJDK + Leiningen — only for running the backend on the host (`./lein … run`) or a REPL/CIDER; bundled in Docker. Use `./lein` (pinned version); JDK version matches `Dockerfile.va-app`. [SDKMAN!](https://sdkman.io/) eases JDK installs.
- PostgreSQL client — for `pg_restore` / manual DB ops; the server runs in Docker.

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

A single root `package.json` builds both frontends. Run from the project root:
```bash
npm run build         # Production build
npm run build-watch   # Watch mode
```

`task dev` runs the watch build automatically.

### Backend Development

Run backend (migrations run automatically on startup):
```bash
./lein with-profile server-local run -m oph.va.hakija.main
```

### Testing

Automated tests are **Playwright E2E** (`playwright/tests/`) and **CDK unit tests** (`cdk/tests/`). No Clojure backend spec tests exist.

```bash
task test                # CDK tests + Playwright E2E (needs `task dev` running; aborts with a hint if not)
npm run playwright:test  # Playwright only (against a running local env)
./cdk/run-tests.sh       # CDK only (no env needed)
```

**IMPORTANT — Playwright testing patterns**: Before writing or modifying Playwright tests, read and follow `playwright/TESTING_PATTERNS.md`. It documents required patterns for avoiding race conditions (cascading API responses, email assertion polling, UI stabilization, awaiting API responses); skipping them produces flaky tests.

**Linting**:
```bash
npm run prettier-check-project   # Check formatting
npm run prettier-fix             # Fix formatting
./lein cljfmt check              # Check Clojure formatting
./lein cljfmt fix                # Fix Clojure formatting
```

### Docker Compose

Full local environment (recommended). `task dev` wraps `start-local-env.sh`, which runs each service in its own tmux pane: database, Playwright type watcher, frontend watch build, VA server (hakija + virkailija), FakeSMTP, Maksatuspalvelu, PagerDuty mock, and Org-mock.
```bash
task dev
```

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

```bash
./lein with-profile server-local run -m oph.va.hakija.main
```

Profiles in `project.clj`: `server-local`, `server-test`, `dev`, `uberjar`, and the CI-only `central-mirror-google`. The runtime config file is chosen via the `config` env var, pointing at an EDN file in `server/config/`.

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
  2. `02-other-tests.sh` - Run CDK tests
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

## Soresu-Form System (Form Rendering & Editing)

### Form Data Model

Forms are stored as JSON in the database, one per avustushaku. The JSON has a `content` array of top-level elements, each of which can have nested `children`. Every element has:
- `fieldClass`: `"formField"` (user-editable inputs), `"infoElement"` (read-only text/labels), or `"wrapperElement"` (structural containers)
- `fieldType`: Specific type — `"textField"`, `"textArea"`, `"radioButton"`, `"p"`, `"h1"`, `"fieldset"`, `"theme"`, `"growingFieldset"`, etc.
- `id`: Unique identifier within the form
- `params`: Optional parameters like `size`, `maxlength`
- `label`/`text`: Localized content with `fi` and `sv` keys

### Form Structure Hierarchy

```
theme (wrapperElement, renders as <section>)
├── formField (renders as <div> with input inside)
├── infoElement (renders as <p>, <h1>, etc.)
└── fieldset (wrapperElement, renders as <fieldset>)
    ├── formField children
    └── infoElement children
```

- **theme**: Top-level section with a heading. Children render vertically.
- **fieldset**: Groups form fields. Uses `display: flex; flex-wrap: wrap` — children render in a **3-column grid** by default.
- **growingFieldset**: Repeatable group with add/remove buttons. Also flex layout.

### Fieldset Layout (CSS)

Key file: `soresu-form/web/form/style/main.css`

Inside `fieldset.soresu-fieldset`:
- **`<div>` children** (form fields): Constrained to `width: calc(var(--section-width) / 3)` — always 1/3 width, creating a 3-column grid.
- **`<p>` children** (info elements): Take full `var(--section-width)` width, so they always get their own row.
- **Radio/checkbox children**: Take full `var(--section-width)` width.
- **Dropdown children**: Take `calc(var(--section-width) / 2)` — half width.
- **`div.extra-large` children**: Take full `var(--section-width)` width (own row).

To make a form field take its own full-width row in a fieldset, set `"params": {"size": "extra-large"}` in the form JSON. This works for text areas (BasicTextArea applies the size as a CSS class on the wrapper div).

### Size Parameter

The `size` param controls element dimensions. Available string values:
- `extra-extra-small`, `extra-small`, `small`, `medium`, `large`, `extra-large`

For **text fields**: Size controls input width (CSS on the `<input>` element). Note: the size class is currently NOT applied to the `<input>` element's className (removed during .jsx-to-.tsx migration), so these CSS rules have no effect. The wrapper div width is still 1/3 in a fieldset regardless of size.

For **text areas**: Size controls textarea height via CSS (e.g., `medium` = 12em, `extra-large` = 24em). Note: like text fields, the size class is NOT applied to the `<textarea>` element's className. However, the default textarea height is already 12em, so `medium` appears to work by coincidence. The size IS applied to the wrapper div className (for layout purposes).

### Form Component Rendering Chain

```
Form JSON field definition
    → PropertyMapper extracts props (size, maxLength, translations, etc.)
    → Component renders (BasicTextArea, BasicTextField, ParagraphInfoElement, etc.)
    → Wrapper element (Fieldset, GrowingFieldset) applies flex layout
    → CSS rules determine final width/height
```

Key files:
- `soresu-form/web/form/Form.jsx` — Main form renderer, dispatches to components by fieldClass
- `soresu-form/web/form/component/PropertyMapper.js` — Extracts props from field definitions
  - `TextFieldPropertyMapper`: Extracts `size`, `maxLength` for form fields
  - `InfoElementPropertyMapper`: Extracts `translations`, `lang` for info elements (does NOT extract `size`)
- `soresu-form/web/form/component/BasicTextArea.tsx` — Renders `<div class="soresu-text-area [size]"><label/><textarea/></div>`
- `soresu-form/web/form/component/BasicTextField.tsx` — Renders `<div class="soresu-text-field"><label/><input/></div>`
- `soresu-form/web/form/component/InfoElement.jsx` — `ParagraphInfoElement` renders `<p class="soresu-info-element">`
- `soresu-form/web/form/component/wrapper/Fieldset.jsx` — Renders `<fieldset class="soresu-fieldset">`
- `soresu-form/web/form/edit/EditComponent.jsx` — `sizeClassName()` method returns size string as CSS class

### Form Editor (Virkailija)

URL: `/admin/form-editor?avustushaku={id}`

The form editor at `va-virkailija/web/va/hakujen-hallinta-page/haku-details/` provides:
- **Visual editor**: WYSIWYG-style editing of form elements (add/remove/reorder fields, edit labels)
- **JSON editor**: Raw JSON textarea at the bottom of the page (click "JSON editoriin" button to reveal it). Label: "Hakulomakkeen sisältö"
- **Save**: Click "Tallenna" button to persist changes. Timestamp shown as "Päivitetty: ..."
- **Preview**: "Hakulomakkeen esikatselu" links (Suomeksi/Ruotsiksi) open the applicant-facing form preview

Form JSON API: `GET /api/avustushaku/{id}/form` returns the full form definition with `content`, `rules`, `created_at`, `updated_at`.

### Togglable Fieldsets

A fieldset can be toggled by a radio button. The pattern is:
```json
{
  "fieldType": "theme",
  "children": [
    {"fieldType": "radioButton", "id": "some-radio"},
    {"fieldType": "fieldset", "id": "togglable-wrapper-xxx", "children": [...]}
  ]
}
```
When the radio button value is "yes"/"Kyllä", the fieldset children become visible. The fieldset id typically starts with `togglable-wrapper-`.

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

- Tests are Playwright E2E (`playwright/tests/`) and CDK unit tests (`cdk/tests/`); run with `task test`. Playwright needs `task dev` running.
- Use the `./lein` script for a consistent, pinned Leiningen version
- Project expects `valtionavustus-secret` repo as **sibling directory** for secrets
- Secrets are loaded from `../valtionavustus-secret/config/secret-dev.edn`
- Main branch is `master`
- Both services (hakija + virkailija) run from single backend in `server/` directory
