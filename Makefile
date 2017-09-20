SHELL := bash  # required for `help` target
LEIN := ../lein

SPECLJ_ARGS ?= -f d
CHILD_PROJECTS ?= soresu-form va-common va-hakija va-virkailija

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
npm-clean:
	$(foreach child_project,$(CHILD_PROJECTS),$(call npm_clean,$(child_project))$(newline))

.PHONY: npm-install-modules
npm-install-modules:
	$(foreach child_project,$(CHILD_PROJECTS),$(call npm_install_modules,$(child_project))$(newline))

.PHONY: npm-build-frontends
npm-build-frontends:
	$(call npm_build,va-hakija)
	$(call npm_build,va-virkailija)

.PHONY: npm-build
npm-build: npm-install-modules npm-build-frontends

.PHONY: npm-test
npm-test:
	$(foreach child_project,$(CHILD_PROJECTS),$(call npm_test,$(child_project))$(newline))

.PHONY: npm-outdated-dependencies
npm-outdated-dependencies:
	$(foreach child_project,$(CHILD_PROJECTS),$(call npm_outdated_dependencies,$(child_project))$(newline))

.PHONY: lein-clean
lein-clean:
	$(foreach child_project,$(CHILD_PROJECTS),$(call lein_clean,$(child_project))$(newline))

.PHONY: lein-install-jar-commons
lein-install-jar-commons:
	$(call lein_install_jar,soresu-form)
	$(call lein_install_jar,va-common)

.PHONY: lein-build-backends
lein-build-backends:
	$(call lein_build,va-hakija)
	$(call lein_build,va-virkailija)

.PHONY: lein-build
lein-build: lein-install-jar-commons lein-build-backends

.PHONY: lein-test
lein-test:
	$(foreach child_project,$(CHILD_PROJECTS),$(call lein_test,$(child_project))$(newline))

.PHONY: lein-outdated-dependencies
lein-outdated-dependencies:
	$(foreach child_project,$(CHILD_PROJECTS),$(call lein_outdated_dependencies,$(child_project))$(newline))

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

  help                        Show this guide.
  clean                       `npm-clean`, `lein-clean`
  build                       `npm-build`, `lein-build`
  test                        `npm-test`, `lein-test`

  npm-clean                   Remove installed npm modules from $$CHILD_PROJECTS.
  npm-install-modules         Install npm modules for $$CHILD_PROJECTS.
  npm-build-frontends         Build frontend sources for va-hakija and va-virkailija.
  npm-build                   `npm-install-modules`, `npm-build-frontends`
  npm-test                    Run npm unit tests for $$CHILD_PROJECTS.
  npm-outdated-dependencies   Show outdated npm modules for $$CHILD_PROJECTS.

  lein-clean                  Remove Leiningen target directories from $$CHILD_PROJECTS.
  lein-install-jar-commons    Install jars for soresu-form and va-common.
  lein-build-backends         Build backend uberjars for va-hakija and va-virkailija.
  lein-build                  `lein-install-jar-commons`, `lein-build-backends`
  lein-test                   Run Leiningen tests for $$CHILD_PROJECTS.
  lein-outdated-dependencies  Show outdated Leiningen dependencies for $$CHILD_PROJECTS.
  lein-install-checkouts      Install Leiningen checkout directories for va-hakija and va-virkailija.
  lein-clean-checkouts        Remove Leiningen checkout directories for va-hakija and va-virkailija.

Examples:

  Run npm unit tests for all child projects:

  make npm-test


  Run npm unit tests for soresu-form:

  make npm-test CHILD_PROJECTS=soresu-form


  Run npm unit tests with JUnit XML reporter for Mocha:

  make npm-test MOCHA_ARGS="--reporter mocha-junit-reporter" MOCHA_FILE="target/junit-mocha-js-unit.xml"


  Run Leiningen tests with JUnit XML reporter for Speclj:

  make lein-test SPECLJ_ARGS="-f junit"


  Run clean build of frontend and backend, followed by tests:

  make clean build test
endef

define npm_clean
cd '$(1)' && rm -fr node_modules
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

define lein_clean
cd '$(1)' && rm -fr target
endef

define lein_install_jar
cd '$(1)' && $(LEIN) with-profile test install
endef

define lein_test
cd '$(1)' && $(LEIN) with-profile test spec $(SPECLJ_ARGS)
endef

define lein_build
cd '$(1)' && $(LEIN) with-profile test uberjar
endef

define lein_outdated_dependencies
@echo '$(1)'
@cd '$(1)' && lein ancient || true
@echo
endef
