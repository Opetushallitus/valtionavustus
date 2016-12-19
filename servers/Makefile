PYTHON_BIN ?= /usr/local/bin/python2.7
PYTHON_REQUIREMENTS ?= requirements.txt
PYTHON_VENV_DIR ?= python-venv

.PHONY: help install clean

help:
	@echo "Usage, run:     source $(PYTHON_VENV_DIR)/bin/activate\nWhen done, run: deactivate"

install: $(PYTHON_VENV_DIR)

$(PYTHON_VENV_DIR): $(PYTHON_REQUIREMENTS)
	rm -rf "$(PYTHON_VENV_DIR)"
	mkdir -p "$(PYTHON_VENV_DIR)"
	pip install virtualenv
	virtualenv -p "$(PYTHON_BIN)" "$(PYTHON_VENV_DIR)"
	pip install -r "$(PYTHON_REQUIREMENTS)"

clean:
	rm -rf "$(PYTHON_VENV_DIR)"
