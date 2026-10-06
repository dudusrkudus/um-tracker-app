import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { locationPayloadSchema } from '@/lib/validation/tracking'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = locationPayloadSchema.parse(body)

    const supabase = createAdminClient()

    // Find the runner by token
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('id, team_id, teams ( event_id, status ), is_tracking_enabled')
      .eq('tracking_token_hash', parsed.token)
      .maybeSingle()

    if (runnerError || !runner) {
      return NextResponse.json({ error: 'Invalid tracking token' }, { status: 401 })
    }

    if (!runner.is_tracking_enabled) {
      return NextResponse.json({ error: 'Tracking is disabled for this runner' }, { status: 403 })
    }

    const team = runner.teams as any
    if (team?.status !== 'running' && team?.status !== 'attention' && team?.status !== 'emergency') {
      return NextResponse.json({ error: 'Team is not currently running' }, { status: 403 })
    }

    // Insert location log
    const { error: insertError } = await supabase
      .from('runner_locations')
      .insert({
        event_id: team.event_id,
        team_id: runner.team_id,
        runner_id: runner.id,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        accuracy_m: parsed.accuracyM,
        speed_kmh: parsed.speedKmh,
        heading: parsed.heading,
        battery_level: parsed.batteryLevel,
        recorded_at: parsed.recordedAt,
        source: 'web_gps'
      })

    if (insertError) {
      console.error('Insert location error:', insertError)
      return NextResponse.json({ error: 'Failed to record location' }, { status: 500 })
    }

    // Update team's last known location (used by dashboard and live map).
    // Only move forward in time so out-of-order packets don't overwrite newer data.
    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({
        last_known_latitude: parsed.latitude,
        last_known_longitude: parsed.longitude,
        last_location_at: parsed.recordedAt,
        last_location_source: 'web_gps',
      })
      .eq('id', runner.team_id)
      .or(`last_location_at.is.null,last_location_at.lte.${parsed.recordedAt}`)

    if (teamUpdateError) {
      console.error('Update team last location error:', teamUpdateError)
      return NextResponse.json({ error: 'Failed to update team location' }, { status: 500 })
    }

    // First GPS ping means the runner is on the course (same rule as checkpoint passage).
    await supabase
      .from('runners')
      .update({ status: 'running' })
      .eq('id', runner.id)
      .eq('status', 'not_started')

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload format', details: err.flatten().fieldErrors }, { status: 400 })
    }
    console.error('Tracking API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
