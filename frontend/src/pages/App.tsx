import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchLanguages, postTranslate, type TranslateResponse } from "../lib/api";
import { addToHistory, clearHistory, loadHistory, type HistoryItem } from "../lib/history";
import { ToastProvider, useToast } from "../lib/toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { LanguagePicker } from "../components/LanguagePicker";

function AppInner() {
  const { push } = useToast();
  const [sourceText, setSourceText] = React.useState("");
  const [translated, setTranslated] = React.useState<TranslateResponse | null>(null);
  const [sourceLang, setSourceLang] = React.useState("auto");
  const [targetLang, setTargetLang] = React.useState("es");
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>(() => loadHistory());

  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth, refetchInterval: 10_000 });
  const languages = useQuery({ queryKey: ["languages"], queryFn: fetchLanguages });

  const translateMutation = useMutation({
    mutationFn: async () => {
      return postTranslate({
        text: sourceText,
        source_lang: sourceLang,
        target_lang: targetLang,
        options: {},
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
      };
      setHistory(addToHistory(item));
    },
    onError: (err) => {
      push(err instanceof Error ? err.message : "Translation failed");
    },
  });

  const modelReady = Boolean(health.data?.model_loaded);

  const canTranslate =
    modelReady && sourceText.trim().length > 0 && Boolean(targetLang) && !translateMutation.isPending;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (canTranslate) translateMutation.mutate();
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
  }, [canTranslate, push, translateMutation, translated?.translated_text]);

  const onSwap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setTranslated(null);
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
    <div className="min-h-screen bg-gradient-to-b from-white to-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">LocalLingua</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Offline translation on your Mac. ⌘Enter translate · ⌘⇧C copy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setHistoryOpen((v) => !v)}>
              {historyOpen ? "Hide history" : "History"} ({history.length})
            </Button>
          </div>
        </header>

        {!modelReady ? (
          <div className="mb-6 rounded-xl border border-border bg-white p-4">
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

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <LanguagePicker
            value={sourceLang}
            onChange={setSourceLang}
            languages={languages.data?.languages ?? []}
            includeAuto
            placeholder="Source"
            disabled={languages.isLoading}
          />
          <Button variant="ghost" onClick={onSwap} disabled={sourceLang === "auto"} title="Swap languages">
            Swap
          </Button>
          <LanguagePicker
            value={targetLang}
            onChange={setTargetLang}
            languages={languages.data?.languages ?? []}
            placeholder="Target"
            disabled={languages.isLoading}
          />
          <div className="flex-1" />
          <Button variant="primary" disabled={!canTranslate} onClick={() => translateMutation.mutate()}>
            {translateMutation.isPending ? "Translating…" : "Translate"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Source</div>
                <div className="text-xs text-foreground/60">{sourceText.length.toLocaleString()} chars</div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste text to translate…"
              />
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSourceText("");
                    setTranslated(null);
                  }}
                  disabled={sourceText.length === 0}
                >
                  Clear
                </Button>
                <div className="text-xs text-foreground/60">Tip: Keep it under ~10k characters.</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Translation</div>
                <div className="text-xs text-foreground/60">
                  {translated ? `${translated.latency_ms}ms` : "—"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[160px] whitespace-pre-wrap rounded-md border border-border bg-white px-3 py-2 text-sm">
                {translated?.translated_text || (
                  <span className="text-foreground/50">Your translation will appear here.</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={onCopy} disabled={!translated?.translated_text}>
                  Copy
                </Button>
                <Button variant="secondary" onClick={onDownload} disabled={!translated?.translated_text}>
                  Download .txt
                </Button>
                <div className="flex-1" />
                {translated?.detected_source_lang ? (
                  <div className="text-xs text-foreground/60">
                    Detected: <span className="font-mono">{translated.detected_source_lang}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {historyOpen ? (
          <div className="mt-6 rounded-xl border border-border bg-white">
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
                    className="w-full rounded-lg px-3 py-3 text-left hover:bg-muted"
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
        ) : null}

        <footer className="mt-10 text-xs text-foreground/60">
          Backend model: {health.data?.model_name ?? "not loaded"} · API base:{" "}
          {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
        </footer>
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
