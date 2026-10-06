import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type Role =
  | 'admin'
  | 'race_director'
  | 'support_coordinator'
  | 'marshal'
  | 'runner'
  | 'viewer'

export type CurrentProfile = {
  id: string
  full_name: string
  role: Role
  is_active: boolean
}

/** Returns the signed-in user's active profile, or null. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.is_active) return null
  return data as CurrentProfile
}

export function hasRole(profile: CurrentProfile | null, roles: readonly string[]): boolean {
  return !!profile && roles.includes(profile.role)
}

/** Most recent live/ready event, used as the operational context. */
export async function getActiveEvent() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, name, status')
    .in('status', ['live', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}
