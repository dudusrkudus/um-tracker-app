'use client'

import { useActionState } from 'react'
import { ArrowRight, Loader2, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, Textarea } from '@/components/ui/native-fields'
import { FormField, FormMessage } from '@/components/forms/form-field'
import { useFormValues } from '@/components/forms/use-form-values'
import { recordRelayChange } from '@/lib/operations-actions'
import { initialActionState } from '@/lib/validation/operations'
import { nowForDateTimeInput } from '@/lib/format'
import {
  activeRunner,
  type CheckpointOption,
  nextRunner,
  runnerLabel,
  suggestedCheckpoint,
  type TeamOption,
} from './types'

export function RelayChangeForm({
  teams,
  checkpoints,
}: {
  teams: TeamOption[]
  checkpoints: CheckpointOption[]
}) {
  const [state, formAction, pending] = useActionState(recordRelayChange, initialActionState)
  const { values, setValues, bind, idFor } = useFormValues(
    'relay',
    () => ({
      team_id: '',
      checkpoint_id: '',
      runner_id: '',
      next_runner_id: '',
      changed_at: nowForDateTimeInput(),
      notes: '',
    }),
    state
  )

  // Relay only makes sense for teams with more than one runner
  const relayTeams = teams.filter((t) => t.runners.length > 1)
  const team = relayTeams.find((t) => t.id === values.team_id)
  const err = state.fieldErrors ?? {}

  function onTeamChange(teamId: string) {
    const t = relayTeams.find((x) => x.id === teamId)
    const current = activeRunner(t)
    setValues((v) => ({
      ...v,
      team_id: teamId,
      runner_id: current?.id ?? '',
      next_runner_id: nextRunner(t, current)?.id ?? '',
      checkpoint_id: suggestedCheckpoint(t, checkpoints)?.id ?? v.checkpoint_id,
    }))
  }

  if (relayTeams.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Belum ada tim relay dengan lebih dari satu pelari terdaftar.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('team_id')} label="Tim" required error={err.team_id}>
          <NativeSelect {...bind('team_id')} onChange={(e) => onTeamChange(e.target.value)} required>
            <option value="">Pilih tim…</option>
            {relayTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.team_code} — {t.team_name}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField id={idFor('checkpoint_id')} label="Lokasi pergantian" required error={err.checkpoint_id}>
          <NativeSelect {...bind('checkpoint_id')} required>
            <option value="">Pilih checkpoint…</option>
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sequence_no}. {c.code} — {c.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <FormField id={idFor('runner_id')} label="Pelari selesai" required error={err.runner_id}>
          <NativeSelect {...bind('runner_id')} disabled={!team} required>
            <option value="">—</option>
            {team?.runners.map((r) => (
              <option key={r.id} value={r.id}>
                {runnerLabel(r)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <ArrowRight className="mx-auto mb-2 hidden h-5 w-5 text-muted-foreground sm:block" aria-hidden />
        <FormField id={idFor('next_runner_id')} label="Pelari berikutnya" required error={err.next_runner_id}>
          <NativeSelect {...bind('next_runner_id')} disabled={!team} required>
            <option value="">—</option>
            {team?.runners
              .filter((r) => r.id !== values.runner_id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {runnerLabel(r)}
                </option>
              ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField id={idFor('changed_at')} label="Waktu pergantian (WIB)" required error={err.changed_at}>
        <Input type="datetime-local" {...bind('changed_at')} required className="h-9" suppressHydrationWarning />
      </FormField>

      <FormField id={idFor('notes')} label="Catatan" error={err.notes}>
        <Textarea {...bind('notes')} rows={2} maxLength={500} placeholder="Opsional, mis. pergantian normal" />
      </FormField>

      <FormMessage state={state} />

      <Button type="submit" disabled={pending} className="h-10 w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" /> : <Repeat />}
        Catat pergantian relay
      </Button>
    </form>
  )
}
