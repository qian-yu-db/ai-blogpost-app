"""Tests for reference_tools: fetch_url, fetch_databricks_docs, parse_code_file."""

import pytest
import respx
import httpx
from pathlib import Path

from src.tools.reference_tools import fetch_url, fetch_databricks_docs, parse_code_file


@pytest.mark.asyncio
class TestFetchUrl:
    @respx.mock
    async def test_fetch_html(self):
        html = "<html><body><p>Hello world</p></body></html>"
        respx.get("https://example.com").mock(
            return_value=httpx.Response(200, text=html, headers={"content-type": "text/html"})
        )
        result = await fetch_url("https://example.com")
        assert "Hello world" in result

    @respx.mock
    async def test_fetch_html_strips_script_style(self):
        html = "<html><body><script>alert(1)</script><style>.x{}</style><p>Content</p></body></html>"
        respx.get("https://example.com").mock(
            return_value=httpx.Response(200, text=html, headers={"content-type": "text/html"})
        )
        result = await fetch_url("https://example.com")
        assert "alert" not in result
        assert "Content" in result

    @respx.mock
    async def test_fetch_html_truncation(self):
        html = "<html><body><p>" + "x" * 20000 + "</p></body></html>"
        respx.get("https://example.com").mock(
            return_value=httpx.Response(200, text=html, headers={"content-type": "text/html"})
        )
        result = await fetch_url("https://example.com")
        assert result.endswith("[Content truncated]")

    @respx.mock
    async def test_fetch_plain_text(self):
        respx.get("https://example.com/file.txt").mock(
            return_value=httpx.Response(200, text="plain text content", headers={"content-type": "text/plain"})
        )
        result = await fetch_url("https://example.com/file.txt")
        assert result == "plain text content"

    @respx.mock
    async def test_fetch_markdown(self):
        respx.get("https://example.com/file.md").mock(
            return_value=httpx.Response(200, text="# Title", headers={"content-type": "text/markdown"})
        )
        result = await fetch_url("https://example.com/file.md")
        assert result == "# Title"

    @respx.mock
    async def test_fetch_binary_content(self):
        respx.get("https://example.com/file.pdf").mock(
            return_value=httpx.Response(200, content=b"binary", headers={"content-type": "application/pdf"})
        )
        result = await fetch_url("https://example.com/file.pdf")
        assert "application/pdf" in result


@pytest.mark.asyncio
class TestFetchDatabricksDocs:
    @respx.mock
    async def test_fetch_docs_with_matches(self):
        # Use plain URL lines (not markdown links) to match what the regex extracts cleanly
        llms_index = (
            "Delta Lake Guide https://docs.databricks.com/delta/index.html Delta Lake overview\n"
            "Spark SQL https://docs.databricks.com/spark/sql.html Spark SQL reference\n"
        )
        respx.get("https://docs.databricks.com/llms.txt").mock(
            return_value=httpx.Response(200, text=llms_index)
        )
        # The regex extracts the full URL; mock the page fetches
        respx.get("https://docs.databricks.com/delta/index.html").mock(
            return_value=httpx.Response(200, text="<html><body><main>Delta content here</main></body></html>")
        )
        result = await fetch_databricks_docs("delta")
        assert "Delta" in result or "delta" in result

    @respx.mock
    async def test_fetch_docs_no_matches(self):
        respx.get("https://docs.databricks.com/llms.txt").mock(
            return_value=httpx.Response(200, text="some unrelated content\n")
        )
        result = await fetch_databricks_docs("xyznonexistent")
        assert "No Databricks documentation found" in result


@pytest.mark.asyncio
class TestParseCodeFile:
    async def test_file_not_found(self):
        result = await parse_code_file("nonexistent.py")
        assert "File not found" in result

    async def test_parse_python_file(self, tmp_path, monkeypatch):
        # Override UPLOADS_DIR to use tmp_path
        import src.tools.reference_tools as ref_mod
        monkeypatch.setattr(ref_mod, "UPLOADS_DIR", tmp_path)

        py_file = tmp_path / "sample.py"
        py_file.write_text("print('hello')")

        result = await parse_code_file("sample.py")
        assert "print('hello')" in result

    async def test_path_traversal_blocked(self, tmp_path, monkeypatch):
        import src.tools.reference_tools as ref_mod
        monkeypatch.setattr(ref_mod, "UPLOADS_DIR", tmp_path)

        result = await parse_code_file("../../etc/passwd")
        assert "Invalid file path" in result or "File not found" in result
