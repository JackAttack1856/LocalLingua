import { addToHistory, clearHistory, loadHistory } from "./history";
import { expect, test } from "vitest";

function mockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  };
}

test("history add/load/clear", () => {
  // @ts-expect-error test shim
  globalThis.localStorage = mockStorage();
  clearHistory();
  expect(loadHistory()).toEqual([]);

  addToHistory({
    id: "1",
    createdAt: 1,
    sourceText: "hi",
    translatedText: "hola",
    sourceLang: "en",
    targetLang: "es",
    detectedSourceLang: "en",
    latencyMs: 10,
  });

  const items = loadHistory();
  expect(items).toHaveLength(1);
  expect(items[0]?.translatedText).toBe("hola");
});
