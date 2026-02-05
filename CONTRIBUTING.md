# Contributing to LocalLingua

Thanks for your interest in contributing!

## Development setup

### Prerequisites
- macOS (Apple Silicon recommended)
- Python 3.11+
- Node.js 18+
- `uv` (Python package manager) and `pnpm` (Node package manager)

### Run the app
1. Copy `.env.example` to `.env` and set `LOCALLINGUA_MODEL_PATH` (or set `LOCALLINGUA_ALLOW_FAKE_TRANSLATOR=1`).
2. Run `make dev`.

### Tests
- `make test` runs backend + frontend tests.

## Pull requests
- Keep changes focused and include tests for new behavior.
- Update `README.md` if you add or change user-visible behavior.

