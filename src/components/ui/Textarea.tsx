import React from 'react'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-border/50 bg-muted/50 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
