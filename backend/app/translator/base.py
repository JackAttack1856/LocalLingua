from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TranslationResult:
    translated_text: str
    detected_source_lang: str | None


class Translator:
    async def translate(
        self,
        *,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict,
    ) -> TranslationResult:
        raise NotImplementedError

