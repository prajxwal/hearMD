import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-24 px-3 py-3 border border-foreground bg-[var(--input-bg)] text-foreground font-mono text-sm transition-colors outline-none resize-y",
        "placeholder:text-[var(--muted-foreground)]",
        "focus:bg-[var(--input-focus)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
