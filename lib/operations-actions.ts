'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/auth'
import {
  type ActionState,
  checkpointLogSchema,
  CLOSED_INCIDENT_STATUSES,
  INCIDENT_MANAGER_ROLES,
  incidentCreateSchema,
  incidentUpdateSchema,
  relayChangeSchema,
  STAFF_WRITE_ROLES,
} from '@/lib/validation/operations'

function invalid(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: 'Periksa kembali isian yang ditandai.',
    fieldErrors: z.flattenError(error).fieldErrors as ActionState['fieldErrors'],
  }
}

/** Translate RPC / PostgREST errors into user-facing messages. */
function dbError(message: string): ActionState {
  if (message.includes('DUPLICATE_CHECKPOINT_LOG')) {
    return { ok: false, message: 'Tim ini sudah tercatat di checkpoint tersebut.' }
  }
  if (message.includes('FORBIDDEN') || message.includes('row-level security')) {
    return { ok: false, message: 'Anda tidak memiliki izin untuk aksi ini.' }
  }
  if (message.includes('AUTH_REQUIRED')) {
    return { ok: false, message: 'Sesi berakhir. Silakan login ulang.' }
  }
  const invalidInput = message.match(/INVALID_INPUT: (.+)/)
  if (invalidInput) return { ok: false, message: `Input tidak valid: ${invalidInput[1]}` }
  console.error('[operations] database error:', message)
  return { ok: false, message: 'Terjadi kesalahan server. Coba lagi.' }
}

function revalidateOperational() {
  revalidatePath('/checkpoint-logs')
  revalidatePath('/dashboard')
  revalidatePath('/map')
}

// ---------------------------------------------------------------------------
// Checkpoint log
// ---------------------------------------------------------------------------
export async function recordCheckpointLog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, STAFF_WRITE_ROLES)) {
    return { ok: false, message: 'Anda tidak memiliki izin mencatat checkpoint.' }
  }

  const parsed = checkpointLogSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc('record_checkpoint_log', {
    p_team_id: d.team_id,
    p_checkpoint_id: d.checkpoint_id,
    p_arrived_at: d.arrived_at,
    p_runner_id: d.runner_id ?? null,
    p_departed_at: d.departed_at ?? null,
    p_relay_changed: false,
    p_next_runner_id: null,
    p_notes: d.notes ?? null,
  })
  if (error) return dbError(error.message)

  revalidateOperational()
  return { ok: true, message: 'Checkpoint berhasil dicatat.', submittedAt: Date.now() }
}

// ---------------------------------------------------------------------------
// Relay change (stored as a checkpoint log with relay_changed = true)
// ---------------------------------------------------------------------------
export async function recordRelayChange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, STAFF_WRITE_ROLES)) {
    return { ok: false, message: 'Anda tidak memiliki izin mencatat pergantian relay.' }
  }

  const parsed = relayChangeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc('record_checkpoint_log', {
    p_team_id: d.team_id,
    p_checkpoint_id: d.checkpoint_id,
    p_arrived_at: d.changed_at,
    p_runner_id: d.runner_id,
    p_departed_at: d.changed_at,
    p_relay_changed: true,
    p_next_runner_id: d.next_runner_id,
    p_notes: d.notes ?? null,
  })
  if (error) return dbError(error.message)

  revalidateOperational()
  revalidatePath('/runners')
  return { ok: true, message: 'Pergantian relay berhasil dicatat.', submittedAt: Date.now() }
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------
const DUPLICATE_WINDOW_MINUTES = 10

export async function createIncident(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, STAFF_WRITE_ROLES)) {
    return { ok: false, message: 'Anda tidak memiliki izin membuat insiden.' }
  }

  const parsed = incidentCreateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)
  const d = parsed.data

  // Only managers may assign a PIC at creation time
  const assignedTo = hasRole(profile, INCIDENT_MANAGER_ROLES) ? d.assigned_to ?? null : null

  const supabase = await createClient()

  // Limit duplicate reports: same team + type still open within the window
  if (d.team_id) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60_000).toISOString()
    const { data: dup } = await supabase
      .from('incidents')
      .select('id')
      .eq('team_id', d.team_id)
      .eq('type', d.type)
      .not('status', 'in', `(${CLOSED_INCIDENT_STATUSES.join(',')})`)
      .gte('reported_at', since)
      .limit(1)
      .maybeSingle()
    if (dup) {
      return {
        ok: false,
        message: `Insiden serupa untuk tim ini sudah dilaporkan dalam ${DUPLICATE_WINDOW_MINUTES} menit terakhir.`,
      }
    }
  }

  if (d.runner_id && d.team_id) {
    const { data: runner } = await supabase
      .from('runners')
      .select('id')
      .eq('id', d.runner_id)
      .eq('team_id', d.team_id)
      .maybeSingle()
    if (!runner) return { ok: false, fieldErrors: { runner_id: ['Pelari bukan anggota tim ini'] } }
  }

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      event_id: d.event_id,
      team_id: d.team_id ?? null,
      runner_id: d.runner_id ?? null,
      type: d.type,
      severity: d.severity,
      description: d.description,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      assigned_to: assignedTo,
      reported_by: profile.id,
    })
    .select('id')
    .single()

  if (error) return dbError(error.message)

  revalidatePath('/incidents')
  revalidatePath('/dashboard')
  redirect(`/incidents/${data.id}`)
}

export async function updateIncident(
  incidentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, message: 'Sesi berakhir. Silakan login ulang.' }
  if (!z.uuid().safeParse(incidentId).success) return { ok: false, message: 'Insiden tidak valid.' }

  const parsed = incidentUpdateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)
  const d = parsed.data

  const supabase = await createClient()
  const { data: current, error: fetchError } = await supabase
    .from('incidents')
    .select('id, status, assigned_to, resolved_at')
    .eq('id', incidentId)
    .maybeSingle()
  if (fetchError) return dbError(fetchError.message)
  if (!current) return { ok: false, message: 'Insiden tidak ditemukan.' }

  const isManager = hasRole(profile, INCIDENT_MANAGER_ROLES)
  const isPic = current.assigned_to === profile.id
  if (!isManager && !isPic) {
    return { ok: false, message: 'Hanya koordinator atau PIC yang dapat memperbarui insiden.' }
  }

  const wasClosed = CLOSED_INCIDENT_STATUSES.includes(current.status)
  const isClosed = CLOSED_INCIDENT_STATUSES.includes(d.status)

  const patch: Record<string, unknown> = {
    status: d.status,
    severity: d.severity,
    resolution_notes: d.resolution_notes ?? null,
    resolved_at: isClosed ? (wasClosed ? current.resolved_at : new Date().toISOString()) : null,
  }
  // A PIC cannot reassign the incident
  if (isManager) patch.assigned_to = d.assigned_to ?? null

  const { error } = await supabase.from('incidents').update(patch).eq('id', incidentId)
  if (error) return dbError(error.message)

  revalidatePath('/incidents')
  revalidatePath(`/incidents/${incidentId}`)
  revalidatePath('/dashboard')
  return { ok: true, message: 'Insiden diperbarui.', submittedAt: Date.now() }
}
