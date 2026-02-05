from __future__ import annotations

from dataclasses import dataclass

from langdetect import DetectorFactory, detect_langs


DetectorFactory.seed = 42


@dataclass(frozen=True)
class Detection:
    code: str | None
    confidence: float | None


def detect_language(text: str) -> Detection:
    try:
        candidates = detect_langs(text)
    except Exception:
        return Detection(code=None, confidence=None)
    if not candidates:
        return Detection(code=None, confidence=None)
    best = candidates[0]
    return Detection(code=getattr(best, "lang", None), confidence=getattr(best, "prob", None))

