import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
};

function Spinner() {
  return (
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-b-transparent",
        "animate-spin",
      )}
      aria-hidden="true"
    />
  );
}

export function Button({
  className,
  variant = "secondary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-medium",
        "transition-colors duration-200 ease-out-expo",
        "focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/35",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.99]",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-3 py-2 text-sm",
        variant === "primary" && "bg-primary text-primaryForeground hover:bg-primary/90",
        variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-muted",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
