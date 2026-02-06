from __future__ import annotations

from app.translator.prompt import build_translation_prompt


def test_prompt_contains_delimiters():
    prompt = build_translation_prompt(text="Hello", source_lang="en", target_lang="es", mode="literal")
    assert "TEXT:" in prompt
    assert "```text" in prompt
    assert "TRANSLATION:" in prompt
    assert "Translate LITERALLY" in prompt
    assert "Output ONLY the translated text" in prompt
