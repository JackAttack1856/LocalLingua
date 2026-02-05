from __future__ import annotations

from ..languages import language_name


def build_translation_prompt(
    *,
    text: str,
    source_lang: str,
    target_lang: str,
) -> str:
    source = "auto" if source_lang == "auto" else language_name(source_lang)
    target = language_name(target_lang)
    return (
        "You are a translation engine.\n"
        "Translate the text from the source language to the target language.\n"
        "Rules:\n"
        "- Preserve meaning, tone, and formatting where reasonable.\n"
        "- Do not add commentary or explanations.\n"
        "- Output ONLY the translated text.\n\n"
        f"Source language: {source}\n"
        f"Target language: {target}\n\n"
        "TEXT:\n"
        "```text\n"
        f"{text}\n"
        "```\n\n"
        "TRANSLATION:\n"
    )

