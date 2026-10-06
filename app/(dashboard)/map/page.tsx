import { createClient } from '@/lib/supabase/server'
import TrackingMapClient from '@/components/maps/TrackingMapClient'

export default async function MapPage() {
  const supabase = await createClient()
  
  // Get active event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .in('status', ['live', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const eventId = event?.id

  // Fetch teams with location
  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_code, status, last_known_latitude, last_known_longitude, last_location_at, runners ( full_name, relay_order, status )')
    .eq('event_id', eventId || '')

  // Fetch checkpoints
  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('id, code, name, latitude, longitude')
    .eq('event_id', eventId || '')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Live Tracking Map</h1>
          <p className="text-xs sm:text-sm text-gray-500">Real-time overview of {event?.name || 'the event'}</p>
        </div>
      </div>
      
      <TrackingMapClient 
        teams={teams || []} 
        checkpoints={checkpoints || []} 
        eventId={eventId}
      />
    </div>
  )
}
