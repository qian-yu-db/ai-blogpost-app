"""Tools for fetching references: URLs, Databricks docs, and code files."""

import httpx
from bs4 import BeautifulSoup
from pathlib import Path

from src.config import UPLOADS_DIR


async def fetch_url(url: str) -> str:
    """Fetch and extract readable text content from a URL."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(url, headers={"User-Agent": "BlogAssistant/1.0"})
            resp.raise_for_status()
    except httpx.TimeoutException:
        return f"Timeout fetching {url} — the page took too long to respond."
    except httpx.HTTPStatusError as e:
        return f"HTTP {e.response.status_code} error fetching {url}"
    except httpx.RequestError as e:
        return f"Failed to fetch {url}: {type(e).__name__}: {e}"

    content_type = resp.headers.get("content-type", "")
    if "text/html" in content_type:
        soup = BeautifulSoup(resp.text, "html.parser")
        # Remove script/style tags
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Limit to avoid huge responses
        if len(text) > 15000:
            text = text[:15000] + "\n\n[Content truncated]"
        return text
    elif "text/plain" in content_type or "text/markdown" in content_type:
        text = resp.text
        if len(text) > 15000:
            text = text[:15000] + "\n\n[Content truncated]"
        return text
    else:
        return f"Fetched {len(resp.content)} bytes of {content_type} content from {url}"


async def fetch_databricks_docs(query: str) -> str:
    """Search Databricks docs via llms.txt and fetch the most relevant pages."""
    llms_url = "https://docs.databricks.com/llms.txt"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(llms_url)
            resp.raise_for_status()
            llms_index = resp.text
    except (httpx.TimeoutException, httpx.RequestError, httpx.HTTPStatusError) as e:
        return f"Failed to fetch Databricks docs index: {type(e).__name__}: {e}"

    # Find lines matching the query (case-insensitive)
    query_lower = query.lower()
    query_words = query_lower.split()
    matches = []
    for line in llms_index.splitlines():
        line_lower = line.lower()
        score = sum(1 for w in query_words if w in line_lower)
        if score > 0:
            matches.append((score, line.strip()))

    matches.sort(key=lambda x: x[0], reverse=True)
    top_matches = matches[:5]

    if not top_matches:
        return f"No Databricks documentation found matching '{query}'. Try broader terms."

    # Extract URLs from matched lines and fetch top results
    results = []
    urls_fetched = []
    for _, line in top_matches:
        # Lines in llms.txt typically have format: "- [title](url): description" or just URLs
        import re
        url_match = re.search(r'https://docs\.databricks\.com\S+', line)
        if url_match:
            doc_url = url_match.group(0).rstrip(')')
            if doc_url not in urls_fetched:
                urls_fetched.append(doc_url)
                results.append(f"**Source**: {doc_url}\n{line}")

    if not results:
        # Return raw matches if no URLs extracted
        return "Relevant Databricks docs entries:\n\n" + "\n".join(line for _, line in top_matches)

    # Fetch the top 2 doc pages
    fetched_content = []
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            for url in urls_fetched[:2]:
                try:
                    resp = await client.get(url, headers={"User-Agent": "BlogAssistant/1.0"})
                    if resp.status_code == 200:
                        soup = BeautifulSoup(resp.text, "html.parser")
                        for tag in soup(["script", "style", "nav", "footer", "header"]):
                            tag.decompose()
                        main = soup.find("main") or soup.find("article") or soup
                        text = main.get_text(separator="\n", strip=True)
                        if len(text) > 5000:
                            text = text[:5000] + "\n[truncated]"
                        fetched_content.append(f"## {url}\n\n{text}")
                except (httpx.TimeoutException, httpx.RequestError):
                    fetched_content.append(f"## {url}\n\n[Failed to fetch page]")
    except Exception:
        pass  # Fall through to return matches without fetched content

    if fetched_content:
        return "\n\n---\n\n".join(fetched_content)

    return "Found these relevant docs:\n\n" + "\n".join(results)


async def parse_code_file(filename: str) -> str:
    """Parse a code file from the uploads directory."""
    from src.utils.file_parser import parse_file

    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        return f"File not found: {filename}. Available uploads directory: {UPLOADS_DIR}"

    # Security: ensure path doesn't escape uploads dir
    resolved = file_path.resolve()
    if not str(resolved).startswith(str(UPLOADS_DIR.resolve())):
        return "Invalid file path."

    content = parse_file(file_path)
    if len(content) > 20000:
        content = content[:20000] + "\n\n[Content truncated]"
    return content
