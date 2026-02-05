from __future__ import annotations

from app.translator.llama_cpp import sanitize_translation


def test_sanitize_strips_fenced_text_block():
    assert sanitize_translation("```text\nHola mundo\n```\n") == "Hola mundo"


def test_sanitize_leaves_plain_text():
    assert sanitize_translation("Hola mundo") == "Hola mundo"


def test_sanitize_strips_generic_fence():
    assert sanitize_translation("```\nHola\n```\n") == "Hola"


def test_sanitize_empty():
    assert sanitize_translation("   \n") == ""

