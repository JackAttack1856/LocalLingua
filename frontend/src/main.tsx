import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./pages/App";
import "./index.css";

type Theme = "light" | "dark" | "system";
const THEME_KEY = "locallingua.theme.v1";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const useDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", useDark);
}

try {
  const raw = localStorage.getItem(THEME_KEY) as Theme | null;
  const theme: Theme = raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
  applyTheme(theme);
} catch {
  // ignore
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
