# LocalLingua Backend

## Dev
- Install: `uv sync --extra dev`
- Run: `uv run uvicorn app.main:app --reload --port 8000`

## Optional: llama-cpp-python
- Install: `uv sync --extra dev --extra llama`
- Set `.env` at repo root (or export env vars) and run the server.

