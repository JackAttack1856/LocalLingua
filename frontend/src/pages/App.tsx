import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchLanguages, postTranslate, type TranslateResponse } from "../lib/api";
import { addToHistory, clearHistory, loadHistory, type HistoryItem } from "../lib/history";
import { ToastProvider, useToast } from "../lib/toast";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { LanguagePicker } from "../components/LanguagePicker";

type Mode = "smart" | "literal" | "natural";
const MODE_KEY = "locallingua.mode.v1";
type Theme = "light" | "dark" | "system";
const THEME_KEY = "locallingua.theme.v1";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const useDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", useDark);
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const isDark = document.documentElement.classList.contains("dark");
  const label = theme === "system" ? (isDark ? "System (dark)" : "System (light)") : theme;
  const common = "h-4 w-4";
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-label={label} role="img">
        <path
          fill="currentColor"
          d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
        />
      </svg>
    );
  }
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-label={label} role="img">
        <path
          fill="currentColor"
          d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-14.5a1 1 0 0 1 1 1V5a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1ZM4.22 5.64a1 1 0 0 1 1.41 0l.36.36A1 1 0 0 1 4.58 7.41l-.36-.36a1 1 0 0 1 0-1.41Zm13.8 13.8a1 1 0 0 1 1.41 0l.36.36a1 1 0 0 1-1.41 1.41l-.36-.36a1 1 0 0 1 0-1.41ZM3.5 13H3a1 1 0 1 1 0-2h.5a1 1 0 1 1 0 2Zm17.5 0H20.5a1 1 0 1 1 0-2H21a1 1 0 1 1 0 2ZM4.22 20.36a1 1 0 0 1 0-1.41l.36-.36A1 1 0 1 1 6 19.99l-.36.36a1 1 0 0 1-1.41 0Zm13.8-13.8a1 1 0 0 1 0-1.41l.36-.36A1 1 0 0 1 19.99 6l-.36.36a1 1 0 0 1-1.41 0Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-label={label} role="img">
      <path
        fill="currentColor"
        d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-14.5a1 1 0 0 1 1 1V5a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

function AppInner() {
  const { push } = useToast();
  const [sourceText, setSourceText] = React.useState("");
  const [translated, setTranslated] = React.useState<TranslateResponse | null>(null);
  const [sourceLang, setSourceLang] = React.useState("auto");
  const [targetLang, setTargetLang] = React.useState("es");
  const [mode, setMode] = React.useState<Mode>(() => {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === "literal" || raw === "natural" || raw === "smart") return raw;
    return "smart";
  });
  const [theme, setTheme] = React.useState<Theme>(() => {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return "system";
  });
  const [history, setHistory] = React.useState<HistoryItem[]>(() => loadHistory());
  const trailFrameRef = React.useRef<HTMLDivElement | null>(null);
  const [trailFrameSize, setTrailFrameSize] = React.useState({ width: 0, height: 0 });
  const sourceTextRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [isSwapping, setIsSwapping] = React.useState(false);
  const swapTimerRef = React.useRef<number | null>(null);

  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth, refetchInterval: 10_000 });
  const languages = useQuery({ queryKey: ["languages"], queryFn: fetchLanguages });

  const translateMutation = useMutation({
    mutationFn: async () => {
      return postTranslate({
        text: sourceText,
        source_lang: sourceLang,
        target_lang: targetLang,
        options: { mode },
      });
    },
    onSuccess: (res) => {
      setTranslated(res);
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        sourceText,
        translatedText: res.translated_text,
        sourceLang,
        targetLang,
        detectedSourceLang: res.detected_source_lang,
        latencyMs: res.latency_ms,
        mode,
        usedMode: res.used_mode ?? null,
      };
      setHistory(addToHistory(item));
    },
    onError: (err) => {
      push(err instanceof Error ? err.message : "Translation failed");
    },
  });

  React.useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  React.useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);

    if (theme !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => applyTheme("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  React.useEffect(() => {
    const frame = trailFrameRef.current;
    if (!frame) return;

    const updateSize = () => {
      setTrailFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const modelReady = Boolean(health.data?.model_loaded);

  const canTranslate =
    modelReady && sourceText.trim().length > 0 && Boolean(targetLang) && !translateMutation.isPending;
  const detectedPill =
    translated &&
    (translated.detected_source_lang ??
      (sourceLang === "auto" ? "??" : sourceLang));
  const trailWidth = Math.max(trailFrameSize.width, 1);
  const trailHeight = Math.max(trailFrameSize.height, 1);
  const trailInset = 0.5;
  const trailRectWidth = Math.max(trailWidth - trailInset * 2, 1);
  const trailRectHeight = Math.max(trailHeight - trailInset * 2, 1);
  const trailRadius = Math.min(18, trailRectWidth / 2, trailRectHeight / 2);

  const triggerTranslate = React.useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.tagName === "TEXTAREA") active.blur();
    translateMutation.mutate();
  }, [translateMutation]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.isComposing) return;
      const active = document.activeElement as HTMLElement | null;
      const isTextarea = active?.tagName === "TEXTAREA";

      if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && isTextarea) {
        e.preventDefault();
        if (canTranslate) triggerTranslate();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (canTranslate) triggerTranslate();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Focus search input in whichever dropdown is open. If none open, open target picker via click hint.
        const input = document.querySelector<HTMLInputElement>('input[placeholder="Search…"]');
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        if (translated?.translated_text) {
          e.preventDefault();
          navigator.clipboard.writeText(translated.translated_text).then(() => push("Copied translation"));
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canTranslate, push, triggerTranslate, translated?.translated_text]);

  const onSwap = () => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (!prefersReduced) {
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      setIsSwapping(true);
      swapTimerRef.current = window.setTimeout(() => setIsSwapping(false), 320);
    }
    if (sourceLang === "auto") {
      const nextTarget = translated?.detected_source_lang ?? "";
      setSourceLang(targetLang);
      setTargetLang(nextTarget);
      setTranslated(null);
      setSourceText("");
      if (!nextTarget) {
        push("Pick a target language after swap");
      }
      return;
    }
    const nextSource = targetLang || "auto";
    setSourceLang(nextSource);
    setTargetLang(sourceLang);
    setTranslated(null);
    setSourceText("");
  };

  const onOutputClick = () => {
    onSwap();
    sourceTextRef.current?.focus();
  };

  const onCopy = async () => {
    if (!translated?.translated_text) return;
    await navigator.clipboard.writeText(translated.translated_text);
    push("Copied translation");
  };

  const onDownload = () => {
    if (!translated?.translated_text) return;
    const blob = new Blob([translated.translated_text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locallingua-${targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onRestore = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslated({
      translated_text: item.translatedText,
      detected_source_lang: item.detectedSourceLang,
      latency_ms: item.latencyMs,
    });
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    push("Restored from history");
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className={[
          "pointer-events-none fixed inset-0 -z-10",
          "bg-[radial-gradient(900px_circle_at_0%_0%,hsl(var(--muted))_0%,transparent_60%),radial-gradient(900px_circle_at_100%_0%,hsl(var(--muted))_0%,transparent_55%)]",
          "dark:bg-[radial-gradient(900px_circle_at_0%_0%,hsl(var(--surface-2))_0%,transparent_60%),radial-gradient(900px_circle_at_100%_0%,hsl(var(--surface-2))_0%,transparent_55%)]",
        ].join(" ")}
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <header className="mb-4 grid min-w-0 grid-cols-[auto_1fr_minmax(0,520px)] grid-rows-2 items-start gap-x-3 gap-y-0">
          <div className="row-span-2 flex h-10 w-10 items-center justify-center">
            <svg
              viewBox="0 0 117.17 122.88"
              className="h-6 w-6 text-foreground"
              role="img"
              aria-label="Translation"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M23.46,98.8l24-7.22-4.24,7.8c8.69,7.36,17.64,9.33,27.58,5.08-9.36,14.77-23.85,16.47-36,10.47l-4.33,7.95-7-24.08ZM23,35.33h9.93V32.77a.33.33,0,0,1,.33-.33H37.8a.33.33,0,0,1,.33.33v2.56h10a.33.33,0,0,1,.33.33v4.75a.32.32,0,0,1-.33.32H46.27a21.5,21.5,0,0,1-.91,4,25,25,0,0,1-1.73,4A32,32,0,0,1,41.55,52c-.72,1-1.51,2-2.35,3a40.33,40.33,0,0,0,4.63,4.61l0,0a55.4,55.4,0,0,0,5.82,4.28.32.32,0,0,1,.1.45l-2.35,3.68a.35.35,0,0,1-.46.1,60.53,60.53,0,0,1-6.24-4.58,44.58,44.58,0,0,1-5-4.9c-1.29,1.23-2.65,2.43-4.07,3.58-1.61,1.29-3.29,2.54-5,3.73a.33.33,0,0,1-.46-.08l-2.47-3.59a.31.31,0,0,1,.08-.45c1.69-1.17,3.34-2.4,4.91-3.68,1.39-1.13,2.72-2.3,3.95-3.51a39.71,39.71,0,0,1-3.15-5.61,44.72,44.72,0,0,1-2.43-6.63.34.34,0,0,1,.23-.4l4.21-1.18a.32.32,0,0,1,.4.23,39.2,39.2,0,0,0,1.92,5.38,37.33,37.33,0,0,0,2.32,4.39c.55-.69,1.07-1.37,1.55-2.06s1.06-1.64,1.51-2.48a19.68,19.68,0,0,0,1.29-2.91,18.87,18.87,0,0,0,.69-2.69H23a.32.32,0,0,1-.33-.32V35.66a.33.33,0,0,1,.33-.33Zm49.5,4.26h32.38a12.38,12.38,0,0,1,12.33,12.34V78a12.38,12.38,0,0,1-12.33,12.34h-1l-.66,9.89a2.62,2.62,0,0,1-4.19,2L83.25,90.35H63.18A12.38,12.38,0,0,1,50.86,78.53H38.67L20.35,93A4.57,4.57,0,0,1,13,89l.8-10.55a14.92,14.92,0,0,1-9.38-4.35l-.28-.3A14.94,14.94,0,0,1,0,63.56V35.71a15,15,0,0,1,15-15H57.49a14.91,14.91,0,0,1,10.57,4.39l.28.29a15,15,0,0,1,4.12,10.28v3.88Zm31.69-14.72L79.31,28.23l5.41-7c-7.42-8.63-16-12-26.43-9.35C69.85-1.26,84.43-.67,95.52,7.17L101,0l3.11,24.87ZM91.58,70.09h-8l-1.48,5H74.89c2.4-6.37,5.18-14,7.59-20.4.87-2.3,1.86-6.12,5-6.12s4.36,3.5,5.27,5.92l7.71,20.71H93.1l-1.52-5.14Zm-1.21-4.9-2.79-8.78-2.8,8.78ZM15,25.32H57.49A10.43,10.43,0,0,1,67.88,35.71V63.56A10.42,10.42,0,0,1,57.49,74H37.09L17.53,89.37,18.69,74H15A10.41,10.41,0,0,1,4.58,63.56V35.71A10.42,10.42,0,0,1,15,25.32Z"
              />
            </svg>
          </div>

          <h1 className="col-start-2 row-start-1 text-xl font-semibold leading-none tracking-tight">LocalLingua</h1>
          <div className="col-start-3 row-start-1 min-w-0 truncate text-right text-xs text-foreground/60">
            Backend model: {health.data?.model_name ?? "not loaded"} · API base:{" "}
            {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
          </div>

          <p className="col-start-2 row-start-2 text-xs leading-none text-foreground/70">
            Enter translate · Shift+Enter newline · ⌘⇧C copy
          </p>
          <div className="col-start-3 row-start-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="justify-end"
              onClick={() => {
                const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
                setTheme(next);
                push(`Theme: ${next}`);
              }}
              title="Toggle theme (system → light → dark)"
            >
              <ThemeIcon theme={theme} />
              <span className="hidden sm:inline">{theme}</span>
            </Button>
          </div>
        </header>

        {!modelReady ? (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Model not configured</div>
                <div className="mt-1 text-sm text-foreground/70">
                  Set <span className="font-mono">LOCALLINGUA_MODEL_PATH</span> (or enable{" "}
                  <span className="font-mono">LOCALLINGUA_ALLOW_FAKE_TRANSLATOR=1</span>) and restart the backend.
                </div>
              </div>
              <div className="text-xs text-foreground/60">
                API: {health.data ? "connected" : health.isError ? "error" : "loading"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex items-center justify-center">
              <LanguagePicker
                value={sourceLang}
                onChange={setSourceLang}
                languages={languages.data?.languages ?? []}
                includeAuto
                placeholder="Source language"
                disabled={languages.isLoading}
              />
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={onSwap}
                title="Swap languages"
                size="sm"
              >
                Swap
              </Button>
            </div>
            <div className="flex items-center justify-center">
            <LanguagePicker
              value={targetLang}
              onChange={setTargetLang}
              languages={languages.data?.languages ?? []}
              placeholder="Choose Target Language"
              placeholderClassName="text-danger"
              disabled={languages.isLoading}
            />
            </div>
          </div>

          <div ref={trailFrameRef} className="relative -m-[6px] rounded-[18px] p-[6px] md:col-span-2">
            {translateMutation.isPending ? (
              <div className="border-trail-overlay">
                <svg
                  viewBox={`0 0 ${trailWidth} ${trailHeight}`}
                  className="h-full w-full overflow-visible"
                  aria-hidden="true"
                >
                  <rect
                    x={trailInset}
                    y={trailInset}
                    width={trailRectWidth}
                    height={trailRectHeight}
                    rx={trailRadius}
                    pathLength="100"
                    fill="none"
                    stroke="rgb(59 130 246 / 0.25)"
                    strokeWidth="6"
                    vectorEffect="non-scaling-stroke"
                    className="border-trail-glow"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x={trailInset}
                    y={trailInset}
                    width={trailRectWidth}
                    height={trailRectHeight}
                    rx={trailRadius}
                    pathLength="100"
                    fill="none"
                    stroke="rgb(59 130 246 / 0.75)"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    className="border-trail-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : null}
            <div className={["grid grid-cols-1 gap-4 md:grid-cols-2", isSwapping ? "swap-animate" : ""].join(" ")}>
              <div className="swap-item swap-left">
                <Textarea
                  ref={sourceTextRef}
                  className="h-[42vh] min-h-[360px] text-base md:h-[58vh] md:min-h-[520px] md:max-h-[720px]"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter text to translate…"
                />
              </div>

              <div className="swap-item swap-right">
                <div
                  className="h-[42vh] min-h-[360px] overflow-hidden rounded-xl border border-border bg-surface2 shadow-sky md:h-[58vh] md:min-h-[520px] md:max-h-[720px]"
                  onClick={onOutputClick}
                >
                  <div className="h-full overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 text-base leading-relaxed">
                    {translated?.translated_text || (
                      <span className="text-foreground/50">Your translation will appear here.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-2 md:col-span-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSourceText("");
                  setTranslated(null);
                }}
                disabled={sourceText.length === 0}
                size="sm"
              >
                Clear
              </Button>
              <div className="text-xs text-foreground/60">{sourceText.length.toLocaleString()} chars</div>
              <div className="flex items-center rounded-full border border-border bg-surface2 p-1">
                <button
                  type="button"
                  onClick={() => setMode("smart")}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    "transition-colors duration-200 ease-out-expo",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35",
                    mode === "smart"
                      ? "bg-foreground/15 text-foreground"
                      : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
                  ].join(" ")}
                  title="Best default: literal first, retry if unchanged"
                >
                  Smart
                </button>
                <button
                  type="button"
                  onClick={() => setMode("literal")}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    "transition-colors duration-200 ease-out-expo",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35",
                    mode === "literal"
                      ? "bg-foreground/15 text-foreground"
                      : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
                  ].join(" ")}
                  title="Strict, 1:1 translation"
                >
                  Literal
                </button>
                <button
                  type="button"
                  onClick={() => setMode("natural")}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    "transition-colors duration-200 ease-out-expo",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35",
                    mode === "natural"
                      ? "bg-foreground/15 text-foreground"
                      : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
                  ].join(" ")}
                  title="More idiomatic translation"
                >
                  Natural
                </button>
              </div>
              {detectedPill ? (
                <Badge
                  className="font-mono"
                  title={
                    translated?.detected_source_lang
                      ? "Detected source language"
                      : sourceLang === "auto"
                        ? "Detection uncertain"
                        : "Selected source language"
                  }
                >
                  {detectedPill}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="primary"
                disabled={!canTranslate}
                onClick={triggerTranslate}
                loading={translateMutation.isPending}
              >
                Translate
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={onCopy} disabled={!translated?.translated_text} size="sm">
                Copy
              </Button>
              <Button variant="secondary" onClick={onDownload} disabled={!translated?.translated_text} size="sm">
                Download .txt
              </Button>
              {translated?.used_mode ? (
                <Badge className="font-mono" title="Mode that produced the final output">
                  {translated.used_mode}
                </Badge>
              ) : null}
              <Badge>{translated ? `${translated.latency_ms}ms` : "—"}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="text-xs">
            {sourceLang === "auto" && translated && translated.detected_source_lang === null ? (
              <span className="text-danger">Detection uncertain — consider choosing a source language.</span>
            ) : (
              <span className="text-transparent">.</span>
            )}
          </div>
          <div className="text-xs text-foreground/60 md:text-right">Tip: keep it under ~10k characters for best speed.</div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-medium">History</div>
            <Button
              variant="ghost"
              onClick={() => {
                clearHistory();
                setHistory([]);
                push("Cleared history");
              }}
              disabled={history.length === 0}
              size="sm"
            >
              Clear history
            </Button>
          </div>
          <div className="max-h-[360px] overflow-auto p-2">
            {history.length === 0 ? (
              <div className="px-2 py-4 text-sm text-foreground/70">No history yet.</div>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  className="w-full rounded-2xl px-3 py-3 text-left transition-colors duration-200 ease-out-expo hover:bg-muted"
                  onClick={() => onRestore(h)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="truncate text-sm font-medium">
                      {h.sourceLang} → {h.targetLang}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {new Date(h.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 max-h-[40px] overflow-hidden text-sm text-foreground/70">
                    {h.sourceText}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <footer className="mt-10 text-xs text-foreground/60" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
