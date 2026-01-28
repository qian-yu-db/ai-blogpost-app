import markdown


def export_markdown(content: str) -> str:
    """Return the markdown content as-is."""
    return content


def export_pdf(content: str, title: str = "blog-post") -> bytes:
    """Convert markdown to PDF."""
    from weasyprint import HTML

    md = markdown.Markdown(extensions=["fenced_code", "codehilite", "tables"])
    html_content = md.convert(content)

    styled_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }}
        h1 {{ font-size: 2em; margin-bottom: 0.5em; }}
        h2 {{ font-size: 1.5em; margin-top: 1.5em; }}
        h3 {{ font-size: 1.25em; margin-top: 1.25em; }}
        pre {{
            background: #f4f4f4;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.9em;
        }}
        code {{
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
        }}
        pre code {{
            background: none;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin: 1em 0;
            padding-left: 1em;
            color: #666;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }}
        th {{
            background: #f4f4f4;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
"""
    return HTML(string=styled_html).write_pdf()
