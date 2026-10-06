'use client'

import { useActionState, useState } from 'react'
import { AlertTriangle, Crosshair, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, Textarea } from '@/components/ui/native-fields'
import { FormField, FormMessage } from '@/components/forms/form-field'
import { useFormValues } from '@/components/forms/use-form-values'
import { createIncident } from '@/lib/operations-actions'
import {
  INCIDENT_SEVERITIES,
  INCIDENT_TYPE_LABELS,
  INCIDENT_TYPES,
  initialActionState,
} from '@/lib/validation/operations'
import { humanize } from '@/lib/format'
import { activeRunner, type ProfileOption, runnerLabel, type TeamOption } from './types'

export function IncidentCreateForm({
  eventId,
  teams,
  profiles,
  canAssign,
  defaultTeamId,
}: {
  eventId: string
  teams: TeamOption[]
  profiles: ProfileOption[]
  canAssign: boolean
  defaultTeamId?: string
}) {
  const [state, formAction, pending] = useActionState(createIncident, initialActionState)
  const { values, set, setValues, bind, idFor } = useFormValues(
    'incident',
    () => {
      const t = teams.find((x) => x.id === defaultTeamId)
      return {
        team_id: t?.id ?? '',
        runner_id: activeRunner(t)?.id ?? '',
        type: '',
        severity: 'medium',
        description: '',
        latitude: '',
        longitude: '',
        assigned_to: '',
      }
    },
    state
  )
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const team = teams.find((t) => t.id === values.team_id)
  const err = state.fieldErrors ?? {}

  function onTeamChange(teamId: string) {
    const t = teams.find((x) => x.id === teamId)
    setValues((v) => ({ ...v, team_id: teamId, runner_id: activeRunner(t)?.id ?? '' }))
  }

  function fillMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6))
        set('longitude', pos.coords.longitude.toFixed(6))
        setGeoStatus('idle')
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('type')} label="Jenis insiden" required error={err.type}>
          <NativeSelect {...bind('type')} required>
            <option value="">Pilih jenis…</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {INCIDENT_TYPE_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">
            Tingkat <span className="text-destructive" aria-hidden>*</span>
          </legend>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {INCIDENT_SEVERITIES.map((s) => (
              <label
                key={s}
                className={
                  'cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-semibold uppercase transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ' +
                  (values.severity === s
                    ? s === 'emergency'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                <input
                  type="radio"
                  name="severity"
                  value={s}
                  checked={values.severity === s}
                  onChange={() => set('severity', s)}
                  className="sr-only"
                />
                {humanize(s)}
              </label>
            ))}
          </div>
          {err.severity?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={idFor('team_id')} label="Tim" error={err.team_id}>
          <NativeSelect {...bind('team_id')} onChange={(e) => onTeamChange(e.target.value)}>
            <option value="">Tidak terkait tim</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.team_code} — {t.team_name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id={idFor('runner_id')} label="Pelari" error={err.runner_id}>
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

      <FormField id={idFor('description')} label="Deskripsi" required error={err.description}>
        <Textarea
          {...bind('description')}
          rows={3}
          maxLength={1000}
          required
          placeholder="Contoh: Pelari mengalami kram berat di KM 87, butuh tim medis."
        />
      </FormField>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <FormField id={idFor('latitude')} label="Latitude" error={err.latitude}>
          <Input {...bind('latitude')} inputMode="decimal" placeholder="-6.8" className="h-9" />
        </FormField>
        <FormField id={idFor('longitude')} label="Longitude" error={err.longitude}>
          <Input {...bind('longitude')} inputMode="decimal" placeholder="107.4" className="h-9" />
        </FormField>
        <Button type="button" variant="outline" onClick={fillMyLocation} disabled={geoStatus === 'loading'} className="h-9">
          {geoStatus === 'loading' ? <Loader2 className="animate-spin" /> : <Crosshair />}
          Lokasi saya
        </Button>
      </div>
      {geoStatus === 'error' && (
        <p className="text-xs text-destructive">Lokasi tidak tersedia. Izinkan akses lokasi atau isi manual.</p>
      )}

      {canAssign && (
        <FormField id={idFor('assigned_to')} label="PIC" error={err.assigned_to} hint="Opsional, dapat ditugaskan nanti">
          <NativeSelect {...bind('assigned_to')}>
            <option value="">Belum ditugaskan</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({humanize(p.role)})
              </option>
            ))}
          </NativeSelect>
        </FormField>
      )}

      <FormMessage state={state} />

      <Button
        type="submit"
        disabled={pending}
        className={
          'h-10 w-full sm:w-auto ' + (values.severity === 'emergency' ? 'bg-red-600 text-white hover:bg-red-700' : '')
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <AlertTriangle />}
        Laporkan insiden
      </Button>
    </form>
  )
}
