import { z } from 'zod'

export const eventSchema = z.object({
  name: z.string().min(3, 'Nama event minimal 3 karakter'),
  event_date: z.string().min(1, 'Tanggal wajib diisi'),
  timezone: z.string().default('Asia/Jakarta'),
  status: z.enum(['draft', 'ready', 'live', 'paused', 'completed', 'cancelled']).default('draft'),
  start_name: z.string().optional(),
  start_latitude: z.coerce.number().optional(),
  start_longitude: z.coerce.number().optional(),
  finish_name: z.string().optional(),
  finish_latitude: z.coerce.number().optional(),
  finish_longitude: z.coerce.number().optional(),
  stale_warning_minutes: z.coerce.number().min(1).default(15),
  stale_critical_minutes: z.coerce.number().min(1).default(30),
})

export const teamSchema = z.object({
  event_id: z.string().uuid(),
  category_id: z.string().uuid(),
  team_code: z.string().min(1, 'Kode tim wajib diisi'),
  team_name: z.string().min(1, 'Nama tim wajib diisi'),
  captain_name: z.string().optional(),
  captain_phone: z.string().optional(),
  support_vehicle: z.string().optional(),
  support_pic: z.string().optional(),
  status: z.enum(['not_started', 'checked_in', 'running', 'waiting_relay', 'resting', 'attention', 'emergency', 'finished', 'dnf', 'unknown']).default('not_started'),
})

export const runnerSchema = z.object({
  team_id: z.string().uuid(),
  full_name: z.string().min(1, 'Nama pelari wajib diisi'),
  phone: z.string().optional(),
  relay_order: z.coerce.number().min(1, 'Urutan relay wajib diisi (mulai dari 1)'),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  status: z.enum(['not_started', 'running', 'completed_leg', 'waiting_relay', 'resting', 'injured', 'evacuated', 'not_detected', 'finished']).default('not_started'),
})

export const checkpointSchema = z.object({
  event_id: z.string().uuid(),
  code: z.string().min(1, 'Kode checkpoint wajib diisi'),
  name: z.string().min(1, 'Nama checkpoint wajib diisi'),
  sequence_no: z.coerce.number().min(1, 'Urutan wajib diisi (mulai dari 1)'),
  distance_km: z.coerce.number().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  geofence_radius_m: z.coerce.number().min(10).default(100),
  is_active: z.boolean().default(true),
})

export type EventFormData = z.infer<typeof eventSchema>
export type TeamFormData = z.infer<typeof teamSchema>
export type RunnerFormData = z.infer<typeof runnerSchema>
export type CheckpointFormData = z.infer<typeof checkpointSchema>
