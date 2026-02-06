export type HealthResponse = {
  status: "ok";
  model_loaded: boolean;
  model_name: string | null;
};

export type Language = { code: string; name: string };
export type LanguagesResponse = { languages: Language[] };

export type TranslateOptions = {
  mode?: "smart" | "literal" | "natural";
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  seed?: number | null;
};

export type TranslateRequest = {
  text: string;
  source_lang: string; // "auto" | code
  target_lang: string;
  options?: TranslateOptions;
};

export type TranslateResponse = {
  translated_text: string;
  detected_source_lang: string | null;
  detection_confidence?: number | null;
  used_mode?: "literal" | "natural" | null;
  latency_ms: number;
};

export type ApiError = { error: { code: string; message: string } };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const err = data as Partial<ApiError>;
    const code = err?.error?.code ?? "HTTP_ERROR";
    const message = err?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(`${code}: ${message}`);
  }

  return data as T;
}

export function fetchHealth() {
  return http<HealthResponse>("/api/health");
}

export function fetchLanguages() {
  return http<LanguagesResponse>("/api/languages");
}

export function postTranslate(body: TranslateRequest) {
  return http<TranslateResponse>("/api/translate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
