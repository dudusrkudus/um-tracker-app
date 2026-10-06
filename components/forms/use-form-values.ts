'use client'

import { useState, type ChangeEvent } from 'react'
import type { ActionState } from '@/lib/validation/operations'

/**
 * Controlled form values that survive React 19's automatic form reset
 * (so input is kept on validation errors) and reset after a successful submit.
 */
export function useFormValues<T extends Record<string, string>>(
  idPrefix: string,
  initial: () => T,
  state: ActionState
) {
  const [values, setValues] = useState<T>(initial)
  const [lastSubmit, setLastSubmit] = useState(state.submittedAt)

  // Reset during render when a new successful submission arrives
  if (state.ok && state.submittedAt !== lastSubmit) {
    setLastSubmit(state.submittedAt)
    setValues(initial())
  }

  const set = <K extends keyof T>(key: K, value: T[K]) => setValues((v) => ({ ...v, [key]: value }))

  const idFor = (key: string) => `${idPrefix}-${key}`

  const bind = (key: keyof T & string) => ({
    id: idFor(key),
    name: key,
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      set(key, e.target.value as T[typeof key]),
    'aria-invalid': state.fieldErrors?.[key] ? true : undefined,
    'aria-describedby': state.fieldErrors?.[key] ? `${idFor(key)}-error` : undefined,
  })

  return { values, set, setValues, bind, idFor }
}
