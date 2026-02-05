import os
from dataclasses import dataclass
from pathlib import Path

_DOTENV_LOADED = False


@dataclass(frozen=True)
class Settings:
    model_path: str | None
    model_name: str | None
    max_concurrency: int
    allow_fake_translator: bool


def load_settings() -> Settings:
    _load_dotenv_once()
    model_path = os.environ.get("LOCALLINGUA_MODEL_PATH") or None
    model_name = os.environ.get("LOCALLINGUA_MODEL_NAME") or None
    max_concurrency_raw = os.environ.get("LOCALLINGUA_MAX_CONCURRENCY", "1")
    allow_fake = os.environ.get("LOCALLINGUA_ALLOW_FAKE_TRANSLATOR", "0") == "1"

    try:
        max_concurrency = max(1, int(max_concurrency_raw))
    except ValueError:
        max_concurrency = 1

    return Settings(
        model_path=model_path,
        model_name=model_name,
        max_concurrency=max_concurrency,
        allow_fake_translator=allow_fake,
    )


def _load_dotenv_once() -> None:
    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return
    _DOTENV_LOADED = True

    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return

    # backend/app/config.py -> repo root is two levels up.
    repo_root = Path(__file__).resolve().parents[2]
    env_path = repo_root / ".env"
    if not env_path.exists():
        return

    load_dotenv(dotenv_path=env_path, override=False)
