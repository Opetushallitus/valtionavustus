SHELL := bash  # required for `help` target

PIP_BIN ?= /usr/local/bin/pip2
PYTHON_BIN ?= /usr/local/bin/python2.7
PYTHON_REQUIREMENTS ?= requirements.txt
PYTHON_VENV_DIR ?= python-venv

.PHONY: help
help:
	@echo -e '$(subst $(newline),\n,$(usage_text))'

.PHONY: clean
clean:
	rm -rf "$(PYTHON_VENV_DIR)"

.PHONY: install
install: $(PYTHON_VENV_DIR)

$(PYTHON_VENV_DIR): $(PYTHON_REQUIREMENTS)
	rm -rf "$(PYTHON_VENV_DIR)"
	mkdir -p "$(PYTHON_VENV_DIR)"
	$(PIP_BIN) install virtualenv
	virtualenv -p "$(PYTHON_BIN)" "$(PYTHON_VENV_DIR)"
	$(PYTHON_VENV_DIR)/bin/pip install -r "$(PYTHON_REQUIREMENTS)"

.PHONY: venv
venv:
	@echo "source $(PYTHON_VENV_DIR)/bin/activate"

define newline


endef

define usage_text
Targets:

  help     Show this guide.
  clean    Uninstall Python virtualenv.
  install  Install Python virtualenv.
  venv     Print shell commands to activate virtualenv.

Examples:

  Activate Python virtualenv for current shell:

  eval `make venv`   # activate virtualenv
  deactivate         # later, to deactivate virtualenv

Remember to set $$ANSIBLE_VAULT_PASSWORD_FILE if you run Ansible
(`source .env-va.sh`).

See README.md for more.
endef
