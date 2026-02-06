from __future__ import annotations

from typing import Literal

from ..languages import language_name


def build_translation_prompt(
    *,
    text: str,
    source_lang: str,
    target_lang: str,
    mode: Literal["literal", "natural"] = "literal",
) -> str:
    source = "Unknown (auto-detect)" if source_lang == "auto" else language_name(source_lang)
    target = language_name(target_lang)

    if mode == "natural":
        rules = (
            "- Translate naturally into the target language.\n"
            "- Prefer common, idiomatic equivalents (e.g., greetings) when appropriate.\n"
            "- Translate common nouns/adjectives; keep proper nouns/brands as-is when they are\n"
            "  clearly names.\n"
            "- Do NOT add extra sentences, commentary, or explanations.\n"
            "- Preserve punctuation, casing, emojis, and line breaks.\n"
            "- Output ONLY the translated text (no quotes, no code fences, no markdown).\n"
        )
    else:
        rules = (
            "- Translate LITERALLY. Do not paraphrase.\n"
            "- Do NOT add information that is not present in the source.\n"
            "- If the source is ungrammatical, incomplete, or nonsensical, still translate\n"
            "  word-for-word.\n"
            "- Preserve punctuation, casing, emojis, and line breaks.\n"
            "- Do not add commentary, explanations, or extra words.\n"
            "- Output ONLY the translated text (no quotes, no code fences, no markdown).\n"
        )

    return (
        "You are a translation engine.\n"
        "Translate the text from the source language to the target language.\n"
        "Rules:\n"
        f"{rules}\n"
        f"Source language: {source}\n"
        f"Target language: {target}\n\n"
        "TEXT:\n"
        "```text\n"
        f"{text}\n"
        "```\n\n"
        "TRANSLATION:\n"
    )
