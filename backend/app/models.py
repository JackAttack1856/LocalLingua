from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class TranslateOptions(BaseModel):
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: int = Field(default=512, ge=1, le=2048)
    seed: int | None = Field(default=42)


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10_000)
    source_lang: str = Field(default="auto")
    target_lang: str
    options: TranslateOptions = Field(default_factory=TranslateOptions)


class TranslateResponse(BaseModel):
    translated_text: str
    detected_source_lang: str | None
    latency_ms: int


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    model_name: str | None


class LanguagesResponse(BaseModel):
    languages: list[dict[str, Any]]

