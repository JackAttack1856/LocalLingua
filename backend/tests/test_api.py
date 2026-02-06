from __future__ import annotations

import os

import httpx
import pytest

from app.config import load_settings
from app.main import create_app
from app.translator.base import TranslationResult, Translator


@pytest.fixture(autouse=True)
def _env():
    os.environ["LOCALLINGUA_ALLOW_FAKE_TRANSLATOR"] = "1"
    os.environ.pop("LOCALLINGUA_MODEL_PATH", None)
    yield


@pytest.fixture()
def app():
    a = create_app()
    a.state.settings = load_settings()
    a.state.translator = _StubTranslator()
    return a


class _StubTranslator(Translator):
    async def translate(
        self,
        *,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict,
    ) -> TranslationResult:
        mode = options.get("mode")
        if mode == "natural":
            return TranslationResult(translated_text=f"NAT:{text}", detected_source_lang=None)
        return TranslationResult(translated_text=text, detected_source_lang=None)


@pytest.mark.asyncio
async def test_health(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True


@pytest.mark.asyncio
async def test_languages(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/languages")
    assert res.status_code == 200
    body = res.json()
    assert "languages" in body
    assert any(lang["code"] == "en" for lang in body["languages"])


@pytest.mark.asyncio
async def test_translate_validates_languages(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/translate",
            json={"text": "hello", "source_lang": "xx", "target_lang": "es", "options": {}},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "UNSUPPORTED_SOURCE_LANG"


@pytest.mark.asyncio
async def test_translate_success(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/translate",
            json={
                "text": "Hello world",
                "source_lang": "auto",
                "target_lang": "es",
                "options": {"mode": "smart"},
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert "translated_text" in body
    assert body["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_translate_smart_retries_on_passthrough(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/translate",
            json={
                "text": "cheeseburger",
                "source_lang": "auto",
                "target_lang": "es",
                "options": {"mode": "smart"},
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert body["translated_text"].startswith("NAT:")
    assert body["used_mode"] == "natural"


@pytest.mark.asyncio
async def test_translate_literal_does_not_retry(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/translate",
            json={
                "text": "cheeseburger",
                "source_lang": "auto",
                "target_lang": "es",
                "options": {"mode": "literal"},
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert body["translated_text"] == "cheeseburger"
    assert body["used_mode"] == "literal"
