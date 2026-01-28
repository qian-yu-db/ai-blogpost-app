import re


def calculate_stats(content: str) -> dict:
    """Calculate word count, character count, and estimated read time."""
    text = re.sub(r"```[\s\S]*?```", "", content)
    text = re.sub(r"`[^`]+`", "", text)
    text = re.sub(r"[#*_\[\]()>-]", "", text)

    words = text.split()
    word_count = len(words)
    character_count = len(content)

    words_per_minute = 200
    read_time_minutes = round(word_count / words_per_minute, 1)

    return {
        "word_count": word_count,
        "character_count": character_count,
        "read_time_minutes": max(0.5, read_time_minutes),
    }
