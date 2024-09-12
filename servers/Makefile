SHELL := bash  # required for `help` target

CFLAGS ?= -I/usr/local/include
LDFLAGS ?= -L/usr/local/lib
PIPENV_BIN ?= pipenv

.PHONY: help
help:
	@echo -e '$(subst $(newline),\n,$(usage_text))'

.PHONY: check_pipenv
check_pipenv:
	@command -v "$(PIPENV_BIN)" || ( echo "$(PIPENV_BIN) not found, see \`make help\`"; exit 1 )

.PHONY: clean
clean: check_pipenv
	pipenv --rm

.PHONY: install
install: check_pipenv
	pipenv install

define newline


endef

define usage_text
Targets:

  help     Show this guide.
  clean    Uninstall Python virtualenv.
  install  Install Python virtualenv.

Examples:

  Activate Python virtualenv for current shell:

  pipenv shell       # enter new shell with activated virtualenv, `exit` to exit

You will need a working installation of Pipenv, see https://docs.pipenv.org/install/


See README.md for more.
endef
