import * as React from "react";
import { cn } from "../../lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "danger";
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
        "transition-colors duration-200 ease-out-expo",
        variant === "neutral" && "border-border bg-surface2 text-foreground/80",
        variant === "success" && "border-border bg-surface2 text-success",
        variant === "danger" && "border-border bg-surface2 text-danger",
        className,
      )}
      {...props}
    />
  );
}

