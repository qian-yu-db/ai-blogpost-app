import json
from pathlib import Path


def parse_python_file(file_path: Path) -> str:
    """Parse a Python file and return its content."""
    return file_path.read_text()


def parse_notebook(file_path: Path) -> str:
    """Parse a Jupyter notebook and extract code cells."""
    content = json.loads(file_path.read_text())
    cells = content.get("cells", [])

    extracted = []
    for i, cell in enumerate(cells):
        cell_type = cell.get("cell_type", "")
        source = "".join(cell.get("source", []))

        if cell_type == "markdown":
            extracted.append(f"# Markdown Cell {i + 1}\n'''\n{source}\n'''")
        elif cell_type == "code":
            extracted.append(f"# Code Cell {i + 1}\n{source}")

    return "\n\n".join(extracted)


def parse_file(file_path: Path) -> str:
    """Parse a file based on its extension."""
    suffix = file_path.suffix.lower()

    if suffix == ".py":
        return parse_python_file(file_path)
    elif suffix == ".ipynb":
        return parse_notebook(file_path)
    else:
        return file_path.read_text()
