import * as React from "react";
import { cn } from "../../lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[180px] w-full resize-none rounded-xl border border-border bg-surface2 px-3.5 py-3 text-sm leading-relaxed shadow-sky",
          "placeholder:text-foreground/40",
          "transition-colors duration-200 ease-out-expo",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500",
          "disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
