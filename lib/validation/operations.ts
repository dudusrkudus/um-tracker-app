import { z } from 'zod'
import { jakartaInputToUtcIso } from '@/lib/format'

export const INCIDENT_TYPES = [
  'injury',
  'lost_contact',
  'vehicle_problem',
  'supplies',
  'gps_problem',
  'stopped',
  'off_route',
  'pickup_request',
  'other',
] as const

export const INCIDENT_TYPE_LABELS: Record<(typeof INCIDENT_TYPES)[number], string> = {
  injury: 'Cedera',
  lost_contact: 'Kehilangan kontak',
  vehicle_problem: 'Kendaraan bermasalah',
  supplies: 'Kekurangan air / makanan',
  gps_problem: 'GPS bermasalah',
  stopped: 'Pelari berhenti',
  off_route: 'Tersesat / keluar rute',
  pickup_request: 'Permintaan penjemputan',
  other: 'Lainnya',
}

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'emergency'] as const
export const INCIDENT_STATUSES = ['open', 'acknowledged', 'in_progress', 'resolved', 'cancelled'] as const
export const CLOSED_INCIDENT_STATUSES: readonly string[] = ['resolved', 'cancelled']

export const INCIDENT_MANAGER_ROLES = ['admin', 'race_director', 'support_coordinator'] as const
export const STAFF_WRITE_ROLES = ['admin', 'race_director', 'support_coordinator', 'marshal'] as const

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

const optionalUuid = z.preprocess(emptyToUndefined, z.uuid().optional())
const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional())

const jakartaDateTime = z
  .string()
  .transform((v, ctx) => {
    const iso = jakartaInputToUtcIso(v)
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Waktu tidak valid' })
      return z.NEVER
    }
    return iso
  })

const optionalJakartaDateTime = z.preprocess(emptyToUndefined, jakartaDateTime.optional())

const optionalCoordinate = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(min).max(max).optional()
  )

export const checkpointLogSchema = z
  .object({
    team_id: z.uuid({ message: 'Pilih tim' }),
    checkpoint_id: z.uuid({ message: 'Pilih checkpoint' }),
    runner_id: optionalUuid,
    arrived_at: jakartaDateTime,
    departed_at: optionalJakartaDateTime,
    notes: optionalText(500),
  })
  .refine((d) => !d.departed_at || d.departed_at >= d.arrived_at, {
    message: 'Waktu berangkat tidak boleh sebelum waktu tiba',
    path: ['departed_at'],
  })

export const relayChangeSchema = z
  .object({
    team_id: z.uuid({ message: 'Pilih tim' }),
    checkpoint_id: z.uuid({ message: 'Pilih checkpoint' }),
    runner_id: z.uuid({ message: 'Pilih pelari yang selesai' }),
    next_runner_id: z.uuid({ message: 'Pilih pelari berikutnya' }),
    changed_at: jakartaDateTime,
    notes: optionalText(500),
  })
  .refine((d) => d.runner_id !== d.next_runner_id, {
    message: 'Pelari berikutnya harus berbeda',
    path: ['next_runner_id'],
  })

export const incidentCreateSchema = z
  .object({
    event_id: z.uuid(),
    team_id: optionalUuid,
    runner_id: optionalUuid,
    type: z.enum(INCIDENT_TYPES, { message: 'Pilih jenis insiden' }),
    severity: z.enum(INCIDENT_SEVERITIES, { message: 'Pilih tingkat' }),
    description: z.string().trim().min(5, 'Deskripsi minimal 5 karakter').max(1000),
    latitude: optionalCoordinate(-90, 90),
    longitude: optionalCoordinate(-180, 180),
    assigned_to: optionalUuid,
  })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    message: 'Isi latitude dan longitude bersamaan',
    path: ['longitude'],
  })
  .refine((d) => !d.runner_id || !!d.team_id, {
    message: 'Pilih tim untuk pelari ini',
    path: ['team_id'],
  })

export const incidentUpdateSchema = z
  .object({
    status: z.enum(INCIDENT_STATUSES),
    severity: z.enum(INCIDENT_SEVERITIES),
    assigned_to: z.preprocess(emptyToUndefined, z.uuid().optional()),
    resolution_notes: optionalText(1000),
  })
  .refine((d) => !CLOSED_INCIDENT_STATUSES.includes(d.status) || !!d.resolution_notes, {
    message: 'Catatan penyelesaian wajib saat menutup insiden',
    path: ['resolution_notes'],
  })

export type FieldErrors = Record<string, string[] | undefined>

export type ActionState = {
  ok: boolean
  message?: string
  fieldErrors?: FieldErrors
  /** Changes on every successful submit so forms can reset. */
  submittedAt?: number
}

export const initialActionState: ActionState = { ok: false }
