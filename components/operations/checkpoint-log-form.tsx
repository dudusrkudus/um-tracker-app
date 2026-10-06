'use client'

import { useActionState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, Textarea } from '@/components/ui/native-fields'
import { FormField, FormMessage } from '@/components/forms/form-field'
import { useFormValues } from '@/components/forms/use-form-values'
import { recordCheckpointLog } from '@/lib/operations-actions'
import { initialActionState } from '@/lib/validation/operations'
import { nowForDateTimeInput } from '@/lib/format'
import {
  activeRunner,
  type CheckpointOption,
  runnerLabel,
  suggestedCheckpoint,
  type TeamOption,
} from './types'

export function CheckpointLogForm({
  teams,
  checkpoints,
}: {
  teams: TeamOption[]
  checkpoints: CheckpointOption[]
}) {
  const [state, formAction, pending] = useActionState(recordCheckpointLog, initialActionState)
  const { values, setValues, bind, idFor } = useFormValues(
    'cp',
    () => ({
      team_id: '',
      runner_id: '',
      checkpoint_id: '',
      arrived_at: nowForDateTimeInput(),
      departed_at: '',
      notes: '',
    }),
    state
  )

  const team = teams.find((t) => t.id === values.team_id)
  const err = state.fieldErrors ?? {}

  function onTeamChange(teamId: string) {
    const t = teams.find((x) => x.id === teamId)
    setValues((v) => ({
      ...v,
      team_id: teamId,
      runner_id: activeRunner(t)?.id ?? '',
      checkpoint_id: suggestedCheckpoint(t, checkpoints)?.id ?? v.checkpoint_id,
    }))
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField id={idFor('team_id')} label="Tim" required error={err.team_id}>
        <NativeSelect {...bind('team_id')} onChange={(e) => onTeamChange(e.target.value)} required>
          <option value="">Pilih tim…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.team_code} — {t.team_name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('checkpoint_id')} label="Checkpoint" required error={err.checkpoint_id}>
          <NativeSelect {...bind('checkpoint_id')} required>
            <option value="">Pilih checkpoint…</option>
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sequence_no}. {c.code} — {c.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField id={idFor('runner_id')} label="Pelari" error={err.runner_id} hint="Otomatis: pelari aktif">
          <NativeSelect {...bind('runner_id')} disabled={!team}>
            <option value="">—</option>
            {team?.runners.map((r) => (
              <option key={r.id} value={r.id}>
                {runnerLabel(r)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('arrived_at')} label="Waktu tiba (WIB)" required error={err.arrived_at}>
          <Input type="datetime-local" {...bind('arrived_at')} required className="h-9" suppressHydrationWarning />
        </FormField>
        <FormField id={idFor('departed_at')} label="Waktu berangkat (WIB)" error={err.departed_at}>
          <Input type="datetime-local" {...bind('departed_at')} className="h-9" />
        </FormField>
      </div>

      <FormField id={idFor('notes')} label="Catatan" error={err.notes}>
        <Textarea {...bind('notes')} rows={2} maxLength={500} placeholder="Opsional" />
      </FormField>

      <FormMessage state={state} />

      <Button type="submit" disabled={pending} className="h-10 w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" /> : <Flag />}
        Catat checkpoint
      </Button>
    </form>
  )
}
