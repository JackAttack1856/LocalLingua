import os
import time
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, load_settings
from .errors import ApiError, as_error_payload
from .languages import LANGUAGES, is_supported
from .models import HealthResponse, LanguagesResponse, TranslateRequest, TranslateResponse
from .translator.base import Translator
from .translator.fake import FakeTranslator
from .translator.lang_detect import detect_language
from .translator.llama_cpp import LlamaCppConfig, LlamaCppTranslator


def _normalize_for_compare(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _is_passthrough(*, source_text: str, translated_text: str) -> bool:
    return _normalize_for_compare(source_text) == _normalize_for_compare(translated_text)


def _has_any_letter(text: str) -> bool:
    return any(ch.isalpha() for ch in (text or ""))


def create_app() -> FastAPI:
    app = FastAPI(title="LocalLingua API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ApiError)
    async def _api_error_handler(_request: Request, exc: ApiError):
        return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message}})

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(_request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request.",
                },
                "details": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def _unhandled_error_handler(_request: Request, exc: Exception):
        # FastAPI's default exception shape differs; keep a consistent shape.
        detail = getattr(exc, "detail", None)
        payload = as_error_payload(detail)
        return JSONResponse(status_code=500, content=payload)

    @app.on_event("startup")
    async def _startup() -> None:
        settings = load_settings()
        app.state.settings = settings
        app.state.translator = _build_translator(settings)

    def get_settings() -> Settings:
        # Ensure repo-root `.env` is loaded even if startup didn't run yet (dev reload edge case).
        if hasattr(app.state, "settings"):
            return app.state.settings
        settings = load_settings()
        app.state.settings = settings
        return settings

    def get_translator(settings: Annotated[Settings, Depends(get_settings)]) -> Translator | None:
        translator = getattr(app.state, "translator", None)
        if translator is None and settings.allow_fake_translator:
            return FakeTranslator()
        return translator

    @app.get("/api/health", response_model=HealthResponse)
    async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
        translator = get_translator(settings)
        if translator is None:
            return HealthResponse(model_loaded=False, model_name=None)
        if isinstance(translator, FakeTranslator):
            return HealthResponse(model_loaded=True, model_name="FakeTranslator")
        # For llama.cpp, consider "loaded" if a model path is set and exists.
        if settings.model_path and Path(settings.model_path).expanduser().exists():
            return HealthResponse(model_loaded=True, model_name=settings.model_name)
        return HealthResponse(model_loaded=False, model_name=None)

    @app.get("/api/languages", response_model=LanguagesResponse)
    async def languages() -> LanguagesResponse:
        return LanguagesResponse(languages=[{"code": l.code, "name": l.name} for l in LANGUAGES])

    @app.post("/api/translate", response_model=TranslateResponse)
    async def translate(
        req: TranslateRequest,
        settings: Annotated[Settings, Depends(get_settings)],
        translator: Annotated[Translator | None, Depends(get_translator)],
    ) -> TranslateResponse:
        if req.source_lang != "auto" and not is_supported(req.source_lang):
            raise ApiError("UNSUPPORTED_SOURCE_LANG", f"Unsupported source_lang: {req.source_lang}", 400)
        if not is_supported(req.target_lang):
            raise ApiError("UNSUPPORTED_TARGET_LANG", f"Unsupported target_lang: {req.target_lang}", 400)

        if translator is None:
            if settings.model_path and not Path(settings.model_path).expanduser().exists():
                raise ApiError(
                    "MODEL_NOT_FOUND",
                    "The configured model file was not found. Check LOCALLINGUA_MODEL_PATH.",
                    503,
                )
            raise ApiError(
                "MODEL_NOT_CONFIGURED",
                "No local model is configured. Set LOCALLINGUA_MODEL_PATH (or enable LOCALLINGUA_ALLOW_FAKE_TRANSLATOR=1).",
                503,
            )

        detected = None
        detection_confidence = None
        effective_source_lang = req.source_lang
        if req.source_lang == "auto":
            detection = detect_language(req.text)
            detection_confidence = detection.confidence
            if detection.code and is_supported(detection.code):
                # Be more permissive for short inputs so we don't fall back to "Unknown" unnecessarily.
                threshold = 0.35 if len(req.text.strip()) <= 20 else 0.70
                if (detection.confidence or 0.0) >= threshold:
                    detected = detection.code
                    effective_source_lang = detected

        start = time.perf_counter()
        requested_mode = req.options.mode

        async def _run_translate(mode: str):
            try:
                return await translator.translate(
                    text=req.text,
                    source_lang=effective_source_lang,
                    target_lang=req.target_lang,
                    options={**req.options.model_dump(), "mode": mode},
                )
            except FileNotFoundError:
                raise ApiError(
                    "MODEL_NOT_FOUND",
                    "The configured model file was not found. Check LOCALLINGUA_MODEL_PATH.",
                    503,
                )
            except RuntimeError as exc:
                if str(exc) == "LLAMA_CPP_NOT_INSTALLED":
                    raise ApiError(
                        "LLAMA_CPP_NOT_INSTALLED",
                        "llama-cpp-python is not installed. Install backend deps with the llama extra.",
                        503,
                    )
                raise

        used_mode: str | None = None
        if requested_mode == "natural":
            result = await _run_translate("natural")
            used_mode = "natural"
        elif requested_mode == "literal":
            result = await _run_translate("literal")
            used_mode = "literal"
        else:
            # smart: try literal first; if unchanged, retry once with natural.
            result = await _run_translate("literal")
            used_mode = "literal"
            should_retry = (
                _has_any_letter(req.text)
                and _is_passthrough(source_text=req.text, translated_text=result.translated_text)
                and not (effective_source_lang != "auto" and req.target_lang == effective_source_lang)
            )
            if should_retry:
                natural_result = await _run_translate("natural")
                if not _is_passthrough(source_text=req.text, translated_text=natural_result.translated_text):
                    result = natural_result
                    used_mode = "natural"

        latency_ms = int((time.perf_counter() - start) * 1000)

        if not result.translated_text.strip():
            raise ApiError(
                "MODEL_EMPTY_OUTPUT",
                "The model returned an empty translation. Try a different text or model quantization.",
                503,
            )

        return TranslateResponse(
            translated_text=result.translated_text,
            detected_source_lang=detected or result.detected_source_lang,
            detection_confidence=detection_confidence,
            used_mode=used_mode,
            latency_ms=latency_ms,
        )

    return app


def _build_translator(settings: Settings) -> Translator | None:
    if settings.model_path:
        model_path = Path(settings.model_path).expanduser()
        if model_path.exists():
            return LlamaCppTranslator(
                LlamaCppConfig(model_path=str(model_path), max_concurrency=settings.max_concurrency)
            )
        return None

    if settings.allow_fake_translator:
        return FakeTranslator()

    return None


app = create_app()
