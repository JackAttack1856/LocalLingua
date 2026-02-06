import React from "react";
import type { Language } from "../lib/api";
import { cn } from "../lib/utils";

type Props = {
  value: string;
  onChange: (code: string) => void;
  languages: Language[];
  placeholder: string;
  includeAuto?: boolean;
  disabled?: boolean;
  placeholderClassName?: string;
};

export function LanguagePicker({
  value,
  onChange,
  languages,
  placeholder,
  includeAuto,
  disabled,
  placeholderClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement | null>(null);

  const items = React.useMemo(() => {
    const all = includeAuto ? [{ code: "auto", name: "Auto-detect" }, ...languages] : languages;
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q));
  }, [includeAuto, languages, query]);

  const selected = React.useMemo(() => {
    if (includeAuto && value === "auto") return "Auto-detect";
    const found = languages.find((l) => l.code === value);
    return found ? found.name : placeholder;
  }, [includeAuto, languages, placeholder, value]);

  const isPlaceholder = React.useMemo(() => {
    if (includeAuto && value === "auto") return false;
    return !languages.some((l) => l.code === value);
  }, [includeAuto, languages, value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group inline-flex w-auto min-w-[80px] max-w-[240px] items-center justify-between rounded-full border border-transparent bg-transparent px-2 py-1.5 text-base font-medium text-foreground",
          "transition-colors duration-200 ease-out-expo",
          "hover:border-border hover:bg-surface2",
          "focus-visible:border-blue-500 focus-visible:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35",
          "disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", isPlaceholder && placeholderClassName)}>{selected}</span>
        <span className="ml-1 text-sm text-foreground/60 opacity-100 transition-opacity duration-200 ease-out-expo">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[46px] z-20 w-[340px] rounded-2xl border border-border bg-surface p-2 text-foreground shadow-skyLift">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="mb-2 w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
          />
          <div className="max-h-[280px] overflow-auto">
            {items.length === 0 ? (
              <div className="px-2 py-2 text-sm text-foreground/70">No matches.</div>
            ) : (
              items.map((l) => (
                <button
                  type="button"
                  key={l.code}
                  onClick={() => {
                    onChange(l.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm",
                    "transition-colors duration-200 ease-out-expo",
                    "hover:bg-muted",
                    value === l.code && "bg-muted",
                  )}
                >
                  <span className="truncate">{l.name}</span>
                  <span className="ml-3 font-mono text-xs text-foreground/60">{l.code}</span>
                </button>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-foreground/60">Tip: Press ⌘K to focus search.</div>
        </div>
      ) : null}
    </div>
  );
}
