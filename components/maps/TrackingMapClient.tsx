'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

// Dynamically import TrackingMap with ssr: false so it never runs on the server
const TrackingMap = dynamic(() => import('./TrackingMap'), { ssr: false })

export default function TrackingMapClient({ teams: initialTeams, checkpoints, eventId }: any) {
  const [teams, setTeams] = useState(initialTeams)
  const supabase = createClient()

  useEffect(() => {
    if (!eventId) return
    
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, team_code, status, last_known_latitude, last_known_longitude, last_location_at, runners ( full_name, relay_order, status )')
        .eq('event_id', eventId)
        
      if (data) {
        setTeams(data)
      }
    }

    // Supabase Realtime Subscription
    const channel = supabase.channel('map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runners' }, () => {
        fetchTeams()
      })
      .subscribe()

    const interval = setInterval(fetchTeams, 15000) // Poll fallback every 15s
    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [eventId, supabase])

  return <TrackingMap teams={teams} checkpoints={checkpoints} />
}
