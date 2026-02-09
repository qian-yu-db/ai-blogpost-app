"""Tests for word_count utility."""

from src.utils.word_count import calculate_stats


class TestCalculateStats:
    def test_basic_text(self):
        stats = calculate_stats("Hello world this is a test")
        assert stats["word_count"] == 6
        assert stats["character_count"] == 26
        assert stats["read_time_minutes"] >= 0.5

    def test_empty_string(self):
        stats = calculate_stats("")
        assert stats["word_count"] == 0
        assert stats["read_time_minutes"] == 0.5  # min clamp

    def test_code_blocks_excluded(self):
        content = "Hello world\n```python\nprint('code')\n```\nEnd"
        stats = calculate_stats(content)
        # "Hello", "world", "End" remain after stripping code blocks
        assert stats["word_count"] == 3

    def test_inline_code_excluded(self):
        content = "Use `pandas` for data"
        stats = calculate_stats(content)
        # After stripping inline code: "Use  for data" → "Use", "for", "data"
        assert stats["word_count"] == 3

    def test_markdown_symbols_stripped(self):
        content = "# Heading\n\n**bold** text"
        stats = calculate_stats(content)
        # After stripping #, *, etc.: "Heading", "bold", "text"
        assert stats["word_count"] == 3

    def test_character_count_is_raw(self):
        content = "# Hello\n\n```python\ncode\n```"
        stats = calculate_stats(content)
        assert stats["character_count"] == len(content)

    def test_read_time_calculation(self):
        # 400 words → 2.0 minutes
        words = " ".join(["word"] * 400)
        stats = calculate_stats(words)
        assert stats["read_time_minutes"] == 2.0
