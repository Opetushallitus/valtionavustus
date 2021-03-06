SHELL := bash  # required for `help` target
LEIN := ../lein

SPECLJ_ARGS ?= -f d

NPM_PROJECTS ?= va-hakija va-virkailija
LEIN_PROJECTS ?= soresu-form va-common va-hakija va-admin-ui va-virkailija

LEIN_CHECKOUTS_BASEDIRS := va-hakija/checkouts va-virkailija/checkouts
LEIN_CHECKOUTS := soresu-form va-common
LEIN_CHECKOUT_DIRS := $(foreach basedir,$(LEIN_CHECKOUTS_BASEDIRS),$(addprefix $(basedir)/,$(LEIN_CHECKOUTS)))
NODE_VERSION := $(shell node --version)
REQUIRED_NODE := $(shell if [ $(NODE_VERSION) == "v12.13.1" ]; then echo true; else echo false; fi)
NPM_VERSION := $(shell npm --version)
REQUIRED_NPM := $(shell if [ $(NPM_VERSION) == "6.13.4" ]; then echo true; else echo false; fi)

.PHONY: help
help:
	@echo -e '$(subst $(newline),\n,$(usage_text))'

.PHONY: check-node
check-node:
	@echo Build requires Node v12.13.1 && $(REQUIRED_NODE)
	@echo Build requires NPM 6.13.4 && $(REQUIRED_NPM)

.PHONY: clean
clean: npm-clean lein-clean

.PHONY: build
build: npm-build lein-build

.PHONY: npm-clean
npm-clean: npm-clean-modules npm-clean-frontends

.PHONY: npm-clean-modules
npm-clean-modules: check-node
	rm -rf node_modules
	rm -f .package-lock.json.checksum

.PHONY: npm-clean-frontends
npm-clean-frontends: check-node
	$(call npm_clean_frontend,va-hakija)
	$(call npm_clean_frontend,va-virkailija)

.PHONY: npm-build
npm-build: check-node
	npm install
	npm run build-production

.PHONY: npm-test
npm-test: check-node

.PHONY: npm-outdated-dependencies
npm-outdated-dependencies: check-node
	npm outdated || true

.PHONY: npm-audit
npm-audit: check-node
	npm audit || true

.PHONY: lein-clean
lein-clean: lein-clean-frontends lein-clean-targets

.PHONY: lein-clean-targets
lein-clean-targets:
	$(foreach lein_project,$(LEIN_PROJECTS),$(call lein_clean_target,$(lein_project))$(newline))
	$(call lein_clean_target,scripts/va-db-tool)

.PHONY: lein-clean-frontends
lein-clean-frontends:
	rm -fr va-virkailija/resources/public/admin-ui/js
	rm -f va-virkailija/resources/public/admin-ui/css/*-min.css
	rm -f va-admin-ui/package*.json
	rm -rf va-admin-ui/node_modules

.PHONY: lein-build
lein-build: lein-install-jar-commons lein-build-frontends lein-build-backends

.PHONY: lein-install-jar-commons
lein-install-jar-commons:
	$(call lein_install_jar,soresu-form)
	$(call lein_install_jar,va-common)

.PHONY: lein-build-frontends
lein-build-frontends:
	$(call lein_build_frontend,va-admin-ui)

.PHONY: lein-build-backends
lein-build-backends:
	$(call lein_build_backend,va-hakija)
	$(call lein_build_backend,va-virkailija)

.PHONY: lein-test
lein-test:
	$(call lein_speclj,soresu-form)
	$(call lein_speclj,va-common)
	$(call lein_speclj,va-hakija)
	$(call lein_doo,va-admin-ui)
	$(call lein_speclj,va-virkailija)

.PHONY: lein-outdated-dependencies
lein-outdated-dependencies:
	$(foreach lein_project,$(LEIN_PROJECTS),$(call lein_outdated_dependencies,$(lein_project))$(newline))

$(LEIN_CHECKOUTS_BASEDIRS):
	mkdir '$@'

$(LEIN_CHECKOUT_DIRS): | $(LEIN_CHECKOUTS_BASEDIRS)
	cd '$(@D)' && ln -s '../../$(@F)' '$(@F)'

.PHONY: lein-install-checkouts
lein-install-checkouts: $(LEIN_CHECKOUT_DIRS)

.PHONY: lein-delete-checkouts
lein-clean-checkouts:
	rm -fr $(LEIN_CHECKOUTS_BASEDIRS)

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

  lein-clean                    `lein-clean-admin-frontend`, `lein-clean-targets`
  lein-clean-targets            Remove Leiningen target directories from $$LEIN_PROJECTS.
  lein-clean-frontends          Remove CLJS build artifacts from va-virkailija and va-hakija, produced by va-admin-ui.
  lein-build                    `lein-install-jar-commons`, `lein-build-frontends`, `lein-build-backends`
  lein-install-jar-commons      Install jars for soresu-form and va-common.
  lein-build-frontends		Build CLJS fronends for va-virkailija and va-hakija (va-admin-ui)
  lein-build-backends           Build backend uberjars for va-hakija and va-virkailija.
  lein-test                     Run Leiningen tests for $$LEIN_PROJECTS.
  lein-outdated-dependencies    Show outdated Leiningen dependencies for $$LEIN_PROJECTS.
  lein-install-checkouts        Install Leiningen checkout directories for va-hakija and va-virkailija.
  lein-clean-checkouts          Remove Leiningen checkout directories for va-hakija and va-virkailija.

Examples:

  Run npm unit tests for all npm projects:

  make npm-test


  Run npm unit tests for soresu-form:

  make npm-test NPM_PROJECTS=soresu-form


  Run npm unit tests with JUnit XML reporter for Mocha:

  make npm-test MOCHA_ARGS="--reporter mocha-junit-reporter" MOCHA_FILE="target/junit-mocha-js-unit.xml"


  Run Leiningen tests with JUnit XML reporter for Speclj:

  make lein-test SPECLJ_ARGS="-f junit"


  Run clean build of frontend and backend, followed by tests:

  make clean build test

See README.md for more.
endef

define npm_clean_frontend
cd '$(1)' && rm -fr resources/public/js
endef

define lein_clean_target
cd '$(1)' && rm -fr target
endef

define lein_install_jar
cd '$(1)' && $(LEIN) install
endef

define lein_speclj
cd '$(1)' && $(LEIN) with-profile test spec $(SPECLJ_ARGS)
endef

define lein_doo
cd '$(1)' && $(LEIN) doo once
endef

define lein_build_backend
cd '$(1)' && $(LEIN) uberjar
endef

define lein_build_frontend
cd '$(1)' && $(LEIN) package
endef

define lein_outdated_dependencies
@echo '$(1)'
@cd '$(1)' && lein ancient || true
@echo
endef
