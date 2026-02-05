from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ApiError(Exception):
    code: str
    message: str
    status_code: int


def as_error_payload(detail: object) -> dict:
    if isinstance(detail, dict) and "error" in detail:
        return detail
    return {"error": {"code": "UNKNOWN", "message": "Unexpected error"}}
