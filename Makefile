SHELL := bash  # required for `help` target
LEIN := ../lein

SPECLJ_ARGS ?= -f d

NPM_PROJECTS ?= soresu-form va-common va-hakija va-virkailija
LEIN_PROJECTS ?= soresu-form va-common va-hakija va-payments-ui va-virkailija

LEIN_CHECKOUTS_BASEDIRS := va-hakija/checkouts va-virkailija/checkouts
LEIN_CHECKOUTS := soresu-form va-common
LEIN_CHECKOUT_DIRS := $(foreach basedir,$(LEIN_CHECKOUTS_BASEDIRS),$(addprefix $(basedir)/,$(LEIN_CHECKOUTS)))

.PHONY: help
help:
	@echo -e '$(subst $(newline),\n,$(usage_text))'

.PHONY: clean
clean: npm-clean lein-clean

.PHONY: build
build: npm-build lein-build

.PHONY: test
test: npm-test lein-test

.PHONY: npm-clean
npm-clean: npm-clean-modules npm-clean-frontends

.PHONY: npm-clean-modules
npm-clean-modules:
	$(foreach npm_project,$(NPM_PROJECTS),$(call npm_clean_modules,$(npm_project))$(newline))

.PHONY: npm-clean-frontends
npm-clean-frontends:
	$(call npm_clean_frontend,va-hakija)
	$(call npm_clean_frontend,va-virkailija)

.PHONY: npm-build
npm-build: npm-install-modules npm-build-frontends

.PHONY: npm-install-modules
npm-install-modules:
	$(foreach npm_project,$(NPM_PROJECTS),$(call npm_install_modules,$(npm_project))$(newline))

.PHONY: npm-build-frontends
npm-build-frontends:
	$(call npm_build,va-hakija)
	$(call npm_build,va-virkailija)

.PHONY: npm-test
npm-test:
	$(foreach npm_project,$(NPM_PROJECTS),$(call npm_test,$(npm_project))$(newline))

.PHONY: npm-outdated-dependencies
npm-outdated-dependencies:
	$(foreach npm_project,$(NPM_PROJECTS),$(call npm_outdated_dependencies,$(npm_project))$(newline))

.PHONY: lein-clean
lein-clean: lein-clean-payments-frontend lein-clean-targets

.PHONY: lein-clean-targets
lein-clean-targets:
	$(foreach lein_project,$(LEIN_PROJECTS),$(call lein_clean_target,$(lein_project))$(newline))

.PHONY: lein-clean-payments-frontend
lein-clean-payments-frontend:
	rm -fr va-virkailija/resources/public/payments/js

.PHONY: lein-build
lein-build: lein-install-jar-commons lein-build-payments-frontend lein-build-backends

.PHONY: lein-install-jar-commons
lein-install-jar-commons:
	$(call lein_install_jar,soresu-form)
	$(call lein_install_jar,va-common)

.PHONY: lein-build-payments-frontend
lein-build-payments-frontend:
	cd va-payments-ui && $(LEIN) package

.PHONY: lein-build-backends
lein-build-backends:
	$(call lein_build_backend,va-hakija)
	$(call lein_build_backend,va-virkailija)

.PHONY: lein-test
lein-test:
	$(call lein_test,soresu-form)
	$(call lein_test,va-common)
	$(call lein_test,va-hakija)
	$(call lein_test,va-virkailija)

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
  npm-build                     `npm-install-modules`, `npm-build-frontends`
  npm-install-modules           Install npm modules for $$NPM_PROJECTS.
  npm-build-frontends           Build frontend sources for va-hakija and va-virkailija.
  npm-test                      Run npm unit tests for $$NPM_PROJECTS.
  npm-outdated-dependencies     Show outdated npm modules for $$NPM_PROJECTS.

  lein-clean                    `lein-clean-payments-frontend`, `lein-clean-targets`
  lein-clean-targets            Remove Leiningen target directories from $$LEIN_PROJECTS.
  lein-clean-payments-frontend  Remove CLJS build artifacts from va-virkailija, produced by va-payments-ui.
  lein-build                    `lein-install-jar-commons`, `lein-build-payments-frontend`, `lein-build-backends`
  lein-install-jar-commons      Install jars for soresu-form and va-common.
  lein-build-payments-frontend  Build CLJS for va-virkailija, produced by va-payments-ui.
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

define npm_clean_modules
cd '$(1)' && rm -fr node_modules
endef

define npm_clean_frontend
cd '$(1)' && rm -fr resources/public/js
endef

define npm_install_modules
cd '$(1)' && npm install --no-save
endef

define npm_test
cd '$(1)' && npm run test
endef

define npm_build
cd '$(1)' && npm run build-production
endef

define npm_outdated_dependencies
@echo '$(1)'
@cd '$(1)' && npm outdated || true
@echo
endef

define lein_clean_target
cd '$(1)' && rm -fr target
endef

define lein_install_jar
cd '$(1)' && $(LEIN) install
endef

define lein_test
cd '$(1)' && $(LEIN) with-profile test spec $(SPECLJ_ARGS)
endef

define lein_build_backend
cd '$(1)' && $(LEIN) uberjar
endef

define lein_outdated_dependencies
@echo '$(1)'
@cd '$(1)' && lein ancient || true
@echo
endef
