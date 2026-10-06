'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(3),
  event_date: z.string(),
  status: z.enum(['draft', 'ready', 'live', 'paused', 'completed', 'cancelled']),
})

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  
  const parsed = eventSchema.safeParse({
    name: formData.get('name'),
    event_date: formData.get('event_date'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { error: 'Invalid input' }
  }

  const { error } = await supabase.from('events').insert([parsed.data])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

const teamSchema = z.object({
  event_id: z.string().uuid(),
  category_id: z.string().uuid(),
  team_code: z.string().min(1),
  team_name: z.string().min(1),
})

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  
  const parsed = teamSchema.safeParse({
    event_id: formData.get('event_id'),
    category_id: formData.get('category_id'),
    team_code: formData.get('team_code'),
    team_name: formData.get('team_name'),
  })

  if (!parsed.success) {
    return { error: 'Invalid team data' }
  }

  const { error } = await supabase.from('teams').insert([parsed.data])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/teams')
  return { success: true }
}

export async function createRunner(formData: FormData) {
  const supabase = await createClient()
  
  const team_id = formData.get('team_id') as string
  const full_name = formData.get('full_name') as string
  const relay_order = parseInt(formData.get('relay_order') as string)

  // Validate Capacity and Unique Relay Order
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('category_id, categories(runner_capacity)')
    .eq('id', team_id)
    .single()

  if (teamError || !teamData) return { error: 'Team not found' }

  const capacity = (teamData.categories as any).runner_capacity

  const { count } = await supabase
    .from('runners')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team_id)

  if (count !== null && count >= capacity) {
    return { error: `Team has reached its maximum capacity of ${capacity} runners` }
  }

  const { data: existingRunner } = await supabase
    .from('runners')
    .select('id')
    .eq('team_id', team_id)
    .eq('relay_order', relay_order)
    .single()

  if (existingRunner) {
    return { error: 'Relay order must be unique within a team' }
  }

  const { error } = await supabase.from('runners').insert([{ team_id, full_name, relay_order }])

  if (error) return { error: error.message }

  revalidatePath('/runners')
  return { success: true }
}
