# LocalLingua

Local-first translation app: **React + Vite** frontend, **FastAPI** backend, and a **local GGUF model** via `llama-cpp-python`.

## Architecture
Browser (React)  ⇄  FastAPI Server  ⇄  TranslateGemma (GGUF via llama.cpp)

## Quickstart (dev)

### Prereqs
- Python 3.11+
- Node.js 18+
- `uv` and `pnpm`

### Setup
1. Copy env file:
   - `cp .env.example .env`
2. Install deps:
   - Backend: `cd backend && uv sync --extra dev --extra llama`
   - Frontend: `cd frontend && pnpm install`
3. Run:
   - `make dev`
4. Open:
   - Frontend: `http://127.0.0.1:5173`

Note: the backend automatically loads the repo-root `.env` file in dev.
If `pnpm install` warns about ignored build scripts (e.g. `esbuild`) and Vite can’t start, run `pnpm approve-builds`.

## Model setup (GGUF)

Set `LOCALLINGUA_MODEL_PATH` in `.env` to your `.gguf` file.

Recommended folder:
- `~/Models/LocalLingua/`

Example:
- `LOCALLINGUA_MODEL_PATH=/Users/you/Models/LocalLingua/translategemma-4b-q4_k_m.gguf`

If you want to develop the UI without a model, set:
- `LOCALLINGUA_ALLOW_FAKE_TRANSLATOR=1`

## Troubleshooting
- If the backend reports `MODEL_NOT_CONFIGURED`, confirm `LOCALLINGUA_MODEL_PATH` points to an existing `.gguf`.
- If you see `LLAMA_CPP_NOT_INSTALLED`, install backend deps via `uv sync`.
- Performance: Apple Silicon + Metal generally performs best with quantized models (e.g. `Q4_K_M`).

## Notes
- TranslateGemma GGUF may emit fenced output (```text ... ```); the backend strips fences and returns plain text.
- If Vite fails with `vite: command not found`, run `cd frontend && pnpm install`.

## Demo script (2 minutes)
1. Paste a paragraph of text.
2. Set target language (e.g. Spanish).
3. Click **Translate** and copy the result.
4. Open History and restore a previous translation.
