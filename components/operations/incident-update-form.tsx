'use client'

import { useActionState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NativeSelect, Textarea } from '@/components/ui/native-fields'
import { FormField, FormMessage } from '@/components/forms/form-field'
import { useFormValues } from '@/components/forms/use-form-values'
import { updateIncident } from '@/lib/operations-actions'
import {
  CLOSED_INCIDENT_STATUSES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  initialActionState,
} from '@/lib/validation/operations'
import { humanize } from '@/lib/format'
import type { ProfileOption } from './types'

type IncidentForUpdate = {
  id: string
  status: string
  severity: string
  assigned_to: string | null
  resolution_notes: string | null
}

export function IncidentUpdateForm({
  incident,
  profiles,
  canAssign,
}: {
  incident: IncidentForUpdate
  profiles: ProfileOption[]
  canAssign: boolean
}) {
  const action = updateIncident.bind(null, incident.id)
  const [state, formAction, pending] = useActionState(action, initialActionState)

  // After success the server re-renders with fresh data; keep the current values
  const current = () => ({
    status: incident.status,
    severity: incident.severity,
    assigned_to: incident.assigned_to ?? '',
    resolution_notes: incident.resolution_notes ?? '',
  })
  const { values, bind, idFor } = useFormValues('upd', current, state)
  const err = state.fieldErrors ?? {}
  const closing = CLOSED_INCIDENT_STATUSES.includes(values.status)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('status')} label="Status" required error={err.status}>
          <NativeSelect {...bind('status')} required>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id={idFor('severity')} label="Tingkat" required error={err.severity}>
          <NativeSelect {...bind('severity')} required>
            {INCIDENT_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField
        id={idFor('assigned_to')}
        label="PIC"
        error={err.assigned_to}
        hint={canAssign ? undefined : 'Hanya koordinator yang dapat menugaskan PIC'}
      >
        <NativeSelect {...bind('assigned_to')} disabled={!canAssign}>
          <option value="">Belum ditugaskan</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} ({humanize(p.role)})
            </option>
          ))}
        </NativeSelect>
      </FormField>
      {/* Disabled selects are not submitted; preserve the value for PIC users */}
      {!canAssign && <input type="hidden" name="assigned_to" value={values.assigned_to} />}

      <FormField
        id={idFor('resolution_notes')}
        label="Catatan penyelesaian"
        required={closing}
        error={err.resolution_notes}
        hint={closing ? 'Wajib saat status resolved / cancelled' : undefined}
      >
        <Textarea {...bind('resolution_notes')} rows={3} maxLength={1000} required={closing} />
      </FormField>

      <FormMessage state={state} />

      <Button type="submit" disabled={pending} className="h-10 w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        Simpan perubahan
      </Button>
    </form>
  )
}
