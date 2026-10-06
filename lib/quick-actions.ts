'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const ADMIN_ROLES = ['admin', 'race_director']

export async function updateEventStatus(id: string, status: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const supabase = await createClient()
  await supabase.from('events').update({ status }).eq('id', id)
  revalidatePath('/events')
  return { success: true }
}

export async function updateTeamStatus(id: string, status: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const supabase = await createClient()
  await supabase.from('teams').update({ status }).eq('id', id)
  revalidatePath('/teams')
  return { success: true }
}

export async function generateRunnerToken(id: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const token = Math.random().toString(36).substring(2, 10).toUpperCase()
  const supabase = await createClient()
  await supabase.from('runners').update({ 
    tracking_token_hash: token,
    is_tracking_enabled: true 
  }).eq('id', id)
  
  revalidatePath('/runners')
  return { success: true, token }
}

export async function updateRunnerStatus(id: string, status: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ADMIN_ROLES)) return { error: 'Unauthorized' }

  const supabase = await createClient()
  await supabase.from('runners').update({ status }).eq('id', id)
  revalidatePath('/runners')
  return { success: true }
}
