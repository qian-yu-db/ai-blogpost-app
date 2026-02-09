"""Tests for file_parser utility."""

import json
from pathlib import Path

from src.utils.file_parser import parse_file, parse_python_file, parse_notebook


class TestParsePythonFile:
    def test_read_python(self, tmp_path):
        py_file = tmp_path / "test.py"
        py_file.write_text("import os\nprint(os.getcwd())")
        result = parse_python_file(py_file)
        assert "import os" in result
        assert "print(os.getcwd())" in result


class TestParseNotebook:
    def test_parse_notebook(self, tmp_path):
        nb = {
            "cells": [
                {"cell_type": "markdown", "source": ["# Title"]},
                {"cell_type": "code", "source": ["print('hello')"]},
            ]
        }
        nb_file = tmp_path / "test.ipynb"
        nb_file.write_text(json.dumps(nb))
        result = parse_notebook(nb_file)
        assert "Markdown Cell 1" in result
        assert "# Title" in result
        assert "Code Cell 2" in result
        assert "print('hello')" in result

    def test_empty_notebook(self, tmp_path):
        nb = {"cells": []}
        nb_file = tmp_path / "empty.ipynb"
        nb_file.write_text(json.dumps(nb))
        result = parse_notebook(nb_file)
        assert result == ""


class TestParseFile:
    def test_dispatch_python(self, tmp_path):
        py = tmp_path / "code.py"
        py.write_text("x = 1")
        assert parse_file(py) == "x = 1"

    def test_dispatch_notebook(self, tmp_path):
        nb = {"cells": [{"cell_type": "code", "source": ["y = 2"]}]}
        nb_file = tmp_path / "nb.ipynb"
        nb_file.write_text(json.dumps(nb))
        result = parse_file(nb_file)
        assert "y = 2" in result

    def test_dispatch_text(self, tmp_path):
        txt = tmp_path / "readme.txt"
        txt.write_text("Hello world")
        assert parse_file(txt) == "Hello world"

    def test_dispatch_markdown(self, tmp_path):
        md = tmp_path / "doc.md"
        md.write_text("# Doc")
        assert parse_file(md) == "# Doc"
