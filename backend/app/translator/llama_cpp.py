from __future__ import annotations

import asyncio
import os
import re
import time
from dataclasses import dataclass

from .base import TranslationResult, Translator
from .prompt import build_translation_prompt


@dataclass(frozen=True)
class LlamaCppConfig:
    model_path: str
    max_concurrency: int


class LlamaCppTranslator(Translator):
    def __init__(self, config: LlamaCppConfig) -> None:
        self._config = config
        self._semaphore = asyncio.Semaphore(config.max_concurrency)
        self._llm = None

    def _load(self):
        if self._llm is not None:
            return self._llm

        try:
            from llama_cpp import Llama  # type: ignore
        except Exception as exc:  # pragma: no cover
            raise RuntimeError("LLAMA_CPP_NOT_INSTALLED") from exc

        if not os.path.exists(self._config.model_path):
            raise FileNotFoundError(self._config.model_path)

        # Heuristic defaults for macOS. Users can tune later.
        self._llm = Llama(
            model_path=self._config.model_path,
            n_ctx=4096,
            n_threads=max(1, (os.cpu_count() or 4) // 2),
            n_gpu_layers=-1,  # try GPU/Metal when available
        )
        return self._llm

    async def translate(
        self,
        *,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict,
    ) -> TranslationResult:
        requested_mode = options.get("mode") or "literal"
        mode = "natural" if requested_mode == "natural" else "literal"
        prompt = build_translation_prompt(
            text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            mode=mode,
        )

        async with self._semaphore:
            llm = self._load()
            start = time.perf_counter()

            def _run():
                # Using create_completion for broad compatibility with GGUF instruct models.
                return llm.create_completion(
                    prompt=prompt,
                    temperature=float(options.get("temperature", 0.2)),
                    top_p=float(options.get("top_p", 0.9)),
                    max_tokens=int(options.get("max_tokens", 512)),
                    seed=options.get("seed", 42),
                )

            result = await asyncio.to_thread(_run)
            elapsed_ms = int((time.perf_counter() - start) * 1000)

        text_out = ""
        try:
            choices = result.get("choices", [])
            if choices:
                text_out = sanitize_translation(choices[0].get("text") or "")
        except Exception:
            text_out = ""

        # detected_source_lang is handled outside (langdetect) for MVP
        return TranslationResult(translated_text=text_out, detected_source_lang=None)


_FENCE_RE = re.compile(r"^\s*```[a-zA-Z0-9_-]*\s*\n(?P<body>[\s\S]*?)\n```\s*$")


def sanitize_translation(text: str) -> str:
    """
    Many GGUF instruct/translation models emit fenced blocks (```text ... ```).
    Strip common wrappers and return the plain translated text.
    """
    t = (text or "").strip()
    if not t:
        return ""

    m = _FENCE_RE.match(t)
    if m:
        return (m.group("body") or "").strip()

    if t.startswith("```"):
        # Best-effort: strip the opening fence line even if it never closed.
        parts = t.split("\n", 1)
        if len(parts) == 2:
            return parts[1].strip()
        return ""

    return t
