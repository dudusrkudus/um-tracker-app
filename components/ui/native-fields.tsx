import * as React from 'react'
import { cn } from 'cn'

const fieldBase =
  'w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm'

function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select data-slot="native-select" className={cn(fieldBase, 'h-9 py-1 pr-8', className)} {...props}>
      {children}
    </select>
  )
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-20 py-2 placeholder:text-muted-foreground', className)}
      {...props}
    />
  )
}

export { NativeSelect, Textarea }
