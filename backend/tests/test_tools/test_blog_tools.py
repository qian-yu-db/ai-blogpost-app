"""Tests for blog_tools: create_outline, review_draft, get_word_stats."""

import json
import pytest

from src.tools.blog_tools import create_outline, review_draft, get_word_stats


@pytest.mark.asyncio
class TestCreateOutline:
    async def test_basic_outline(self):
        result = await create_outline(
            topic="Delta Lake",
            audience="data engineers",
            technical_level="intermediate",
        )
        assert "# Blog Post Outline" in result
        assert "Delta Lake" in result
        assert "data engineers" in result
        assert "intermediate" in result

    async def test_outline_with_key_points(self):
        result = await create_outline(
            topic="MLflow",
            audience="ML engineers",
            technical_level="advanced",
            key_points=["Model tracking", "Registry"],
        )
        assert "Model tracking" in result
        assert "Registry" in result
        assert "Key Points to Cover" in result

    async def test_outline_with_style(self):
        result = await create_outline(
            topic="Spark",
            audience="beginners",
            technical_level="beginner",
            style="deep-dive",
        )
        assert "deep-dive" in result

    async def test_outline_structure_sections(self):
        result = await create_outline(
            topic="Topic", audience="devs", technical_level="intermediate"
        )
        assert "### Introduction" in result
        assert "### Section 1: Foundation" in result
        assert "### Section 2: Implementation" in result
        assert "### Section 3: Advanced Topics" in result
        assert "### Conclusion" in result


@pytest.mark.asyncio
class TestReviewDraft:
    async def test_review_returns_json(self):
        result = await review_draft(content="# Test Blog\n\nSome content here.")
        parsed = json.loads(result)
        assert "dimensions" in parsed
        assert "content_stats" in parsed

    async def test_review_dimensions(self):
        result = await review_draft(content="# Blog\n\nContent")
        parsed = json.loads(result)
        dims = parsed["dimensions"]
        assert "technical_accuracy" in dims
        assert "clarity_and_structure" in dims
        assert "audience_fit" in dims
        assert "polish" in dims

    async def test_review_with_audience(self):
        result = await review_draft(
            content="# Test", target_audience="data engineers", technical_level="advanced"
        )
        parsed = json.loads(result)
        audience_dim = parsed["dimensions"]["audience_fit"]
        assert "data engineers" in audience_dim["description"]
        assert "advanced" in audience_dim["description"]

    async def test_review_content_preview_truncation(self):
        long_content = "x" * 1000
        result = await review_draft(content=long_content)
        parsed = json.loads(result)
        assert parsed["content_preview"].endswith("...")
        assert len(parsed["content_preview"]) == 503  # 500 + "..."


@pytest.mark.asyncio
class TestGetWordStats:
    async def test_basic_stats(self):
        result = await get_word_stats(content="Hello world this is a test")
        parsed = json.loads(result)
        assert parsed["word_count"] == 6
        assert parsed["character_count"] == 26
        assert parsed["read_time_minutes"] >= 0.5

    async def test_empty_content(self):
        result = await get_word_stats(content="")
        parsed = json.loads(result)
        assert parsed["word_count"] == 0
        assert parsed["read_time_minutes"] == 0.5  # min value
