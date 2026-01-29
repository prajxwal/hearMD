import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-3 py-3 border border-foreground bg-[var(--input-bg)] text-foreground font-mono text-sm transition-colors outline-none",
        "placeholder:text-[var(--muted-foreground)]",
        "focus:bg-[var(--input-focus)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
