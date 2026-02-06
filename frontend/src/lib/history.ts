export type HistoryItem = {
  id: string;
  createdAt: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedSourceLang: string | null;
  latencyMs: number;
  mode: "smart" | "literal" | "natural";
  usedMode?: "literal" | "natural" | null;
};

const KEY = "locallingua.history.v1";
const MAX_ITEMS = 50;

export function loadHistory(): HistoryItem[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      mode: (item as Partial<HistoryItem>).mode ?? "smart",
    }));
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function addToHistory(item: HistoryItem) {
  const items = loadHistory();
  const next = [item, ...items].slice(0, MAX_ITEMS);
  saveHistory(next);
  return next;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
