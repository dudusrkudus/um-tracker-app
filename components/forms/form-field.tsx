import * as React from 'react'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/lib/validation/operations'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string
  label: string
  error?: string[]
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error?.map((e) => (
        <p key={e} id={`${id}-error`} className="text-xs text-destructive">
          {e}
        </p>
      ))}
    </div>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null
  const Icon = state.ok ? CheckCircle2 : AlertCircle
  return (
    <div
      role={state.ok ? 'status' : 'alert'}
      aria-live="polite"
      className={
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ' +
        (state.ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800')
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  )
}
