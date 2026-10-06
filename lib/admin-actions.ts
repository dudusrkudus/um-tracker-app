'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eventSchema, teamSchema, runnerSchema, checkpointSchema } from './validation/admin'
import { getCurrentProfile, hasRole } from './auth'

const ADMIN_ROLES = ['admin', 'race_director']

export async function createEvent(prevState: any, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const data = {
    name: formData.get('name'),
    event_date: formData.get('event_date'),
    timezone: formData.get('timezone') || 'Asia/Jakarta',
    status: formData.get('status') || 'draft',
    start_name: formData.get('start_name') || undefined,
    start_latitude: formData.get('start_latitude') || undefined,
    start_longitude: formData.get('start_longitude') || undefined,
    finish_name: formData.get('finish_name') || undefined,
    finish_latitude: formData.get('finish_latitude') || undefined,
    finish_longitude: formData.get('finish_longitude') || undefined,
    stale_warning_minutes: formData.get('stale_warning_minutes') || 15,
    stale_critical_minutes: formData.get('stale_critical_minutes') || 30,
  }

  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) {
    console.error('Validation error:', parsed.error.format())
    return { error: 'Data tidak valid: ' + parsed.error.issues[0].message, details: parsed.error.format() }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('events').insert({
    ...parsed.data,
    created_by: profile.id
  })

  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createTeam(prevState: any, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const data = {
    event_id: formData.get('event_id'),
    category_id: formData.get('category_id'),
    team_code: formData.get('team_code'),
    team_name: formData.get('team_name'),
    captain_name: formData.get('captain_name') || undefined,
    captain_phone: formData.get('captain_phone') || undefined,
    support_vehicle: formData.get('support_vehicle') || undefined,
    support_pic: formData.get('support_pic') || undefined,
    status: formData.get('status') || 'not_started',
  }

  const parsed = teamSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data tidak valid', details: parsed.error.format() }

  const supabase = await createClient()
  const { error } = await supabase.from('teams').insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath('/teams')
  return { success: true }
}

export async function createRunner(prevState: any, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const data = {
    team_id: formData.get('team_id'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || undefined,
    relay_order: formData.get('relay_order'),
    emergency_contact_name: formData.get('emergency_contact_name') || undefined,
    emergency_contact_phone: formData.get('emergency_contact_phone') || undefined,
    status: formData.get('status') || 'not_started',
  }

  const parsed = runnerSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data tidak valid', details: parsed.error.format() }

  const supabase = await createClient()
  const { error } = await supabase.from('runners').insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath('/runners')
  return { success: true }
}

export async function createCheckpoint(prevState: any, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const data = {
    event_id: formData.get('event_id'),
    code: formData.get('code'),
    name: formData.get('name'),
    sequence_no: formData.get('sequence_no'),
    distance_km: formData.get('distance_km') || undefined,
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    geofence_radius_m: formData.get('geofence_radius_m') || 100,
    is_active: formData.has('is_active') ? formData.get('is_active') === 'true' : true,
  }

  const parsed = checkpointSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data tidak valid', details: parsed.error.format() }

  const supabase = await createClient()
  const { error } = await supabase.from('checkpoints').insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath('/checkpoints')
  return { success: true }
}

export async function updateCheckpoint(id: string, prevState: any, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const data = {
    event_id: formData.get('event_id'),
    code: formData.get('code'),
    name: formData.get('name'),
    sequence_no: formData.get('sequence_no'),
    distance_km: formData.get('distance_km') || undefined,
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    geofence_radius_m: formData.get('geofence_radius_m') || 100,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = checkpointSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data tidak valid' }

  const supabase = await createClient()
  const { error } = await supabase.from('checkpoints').update(parsed.data).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/checkpoints')
  revalidatePath('/map')
  return { success: true }
}
