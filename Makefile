SHELL := bash  # required for `help` target
LEIN := ../lein

SPECLJ_ARGS ?= -f d

NPM_PROJECTS ?= va-hakija va-virkailija

.PHONY: help
help:
	@echo -e '$(subst $(newline),\n,$(usage_text))'

.PHONY: clean
clean: npm-clean lein-clean

.PHONY: build
build: npm-build lein-build

.PHONY: npm-clean
npm-clean: npm-clean-modules npm-clean-frontends

.PHONY: npm-clean-modules
npm-clean-modules:
	rm -rf node_modules
	rm -f .package-lock.json.checksum

.PHONY: npm-clean-frontends
npm-clean-frontends:
	rm -rf server/resources/public/js

.PHONY: npm-build
npm-build:
	npm ci
	npm run build-production

.PHONY: npm-outdated-dependencies
npm-outdated-dependencies:
	npm outdated || true

.PHONY: npm-audit
npm-audit:
	npm audit || true

.PHONY: lein-clean
	rm -fr target server/target

.PHONY: lein-build
lein-build:
	./lein uberjar

.PHONY: lein-test
lein-test:
	./lein with-profile test-legacy,user spec $(SPECLJ_ARGS)

.PHONY: lein-outdated-dependencies
lein-outdated-dependencies:
	./lein ancient || true

define newline


endef

define usage_text
Targets:

  help                          Show this guide.

  clean                         `npm-clean`, `lein-clean`
  build                         `npm-build`, `lein-build`
  test                          `npm-test`, `lein-test`

  npm-clean                     `npm-clean-modules`, `npm-clean-frontends`
  npm-clean-modules             Remove installed npm modules from $$NPM_PROJECTS.
  npm-clean-frontends           Remove frontend build products from va-hakija and va-virkailija.
  npm-test                      Run npm unit tests for $$NPM_PROJECTS.
  npm-outdated-dependencies     Show outdated npm modules for $$NPM_PROJECTS.
  npm-audit                     Run npm audit for $$NPM_PROJECTS.

  lein-clean                    Remove Leiningen target directories.
  lein-build                    Build backend uberjar.
  lein-test                     Run Leiningen tests.
  lein-outdated-dependencies    Show outdated Leiningen dependencies.

Examples:

  Run npm unit tests for all npm projects:

  make npm-test


  Run npm unit tests for soresu-form:

  make npm-test NPM_PROJECTS=soresu-form

  Run Leiningen tests with JUnit XML reporter for Speclj:

  make lein-test SPECLJ_ARGS="-f junit"


  Run clean build of frontend and backend, followed by tests:

  make clean build test

See README.md for more.
endef
