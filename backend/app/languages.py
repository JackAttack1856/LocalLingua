from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Language:
    code: str
    name: str


# Curated list for MVP; can be expanded later.
LANGUAGES: list[Language] = [
    Language("en", "English"),
    Language("es", "Spanish"),
    Language("fr", "French"),
    Language("de", "German"),
    Language("it", "Italian"),
    Language("pt", "Portuguese"),
    Language("nl", "Dutch"),
    Language("sv", "Swedish"),
    Language("no", "Norwegian"),
    Language("da", "Danish"),
    Language("fi", "Finnish"),
    Language("pl", "Polish"),
    Language("cs", "Czech"),
    Language("tr", "Turkish"),
    Language("ru", "Russian"),
    Language("uk", "Ukrainian"),
    Language("ar", "Arabic"),
    Language("he", "Hebrew"),
    Language("hi", "Hindi"),
    Language("bn", "Bengali"),
    Language("ur", "Urdu"),
    Language("ja", "Japanese"),
    Language("ko", "Korean"),
    Language("zh", "Chinese"),
]


def is_supported(code: str) -> bool:
    return any(lang.code == code for lang in LANGUAGES)


def language_name(code: str) -> str:
    for lang in LANGUAGES:
        if lang.code == code:
            return lang.name
    return code

