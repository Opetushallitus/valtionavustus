PIP_BIN ?= /usr/local/bin/pip2
PYTHON_BIN ?= /usr/local/bin/python2.7
PYTHON_REQUIREMENTS ?= requirements.txt
PYTHON_VENV_DIR ?= python-venv

.PHONY: help venv install uninstall

help:
	@echo 'make install        Install Python virtualenv'
	@echo 'make uninstall      Uninstall Python virtualenv'
	@echo 'eval `make venv`    Activate Python virtualenv for current shell'
	@echo 'deactivate          Deactivate Python virtualenv from current shell'
	@echo
	@echo 'See README.md for more.'

venv:
	@echo "source $(PYTHON_VENV_DIR)/bin/activate"

install: $(PYTHON_VENV_DIR)

$(PYTHON_VENV_DIR): $(PYTHON_REQUIREMENTS)
	rm -rf "$(PYTHON_VENV_DIR)"
	mkdir -p "$(PYTHON_VENV_DIR)"
	$(PIP_BIN) install virtualenv
	virtualenv -p "$(PYTHON_BIN)" "$(PYTHON_VENV_DIR)"
	$(PYTHON_VENV_DIR)/bin/pip install -r "$(PYTHON_REQUIREMENTS)"

uninstall:
	rm -rf "$(PYTHON_VENV_DIR)"
