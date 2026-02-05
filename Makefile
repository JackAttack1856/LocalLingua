.PHONY: dev dev-backend dev-frontend test test-backend test-frontend lint lint-backend lint-frontend

dev:
	@$(MAKE) -j 2 dev-backend dev-frontend

dev-backend:
	@cd backend && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend:
	@cd frontend && pnpm dev --host 127.0.0.1 --port 5173

test: test-backend test-frontend

test-backend:
	@cd backend && uv run pytest

test-frontend:
	@cd frontend && pnpm test

lint: lint-backend lint-frontend

lint-backend:
	@cd backend && uv run ruff check .

lint-frontend:
	@cd frontend && pnpm lint

