from __future__ import annotations

import re

from .base import TranslationResult, Translator


class FakeTranslator(Translator):
    async def translate(
        self,
        *,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict,
    ) -> TranslationResult:
        cleaned = re.sub(r"\s+", " ", text).strip()
        prefix = f"[fake {source_lang}->{target_lang}] "
        return TranslationResult(translated_text=prefix + cleaned, detected_source_lang=None)

