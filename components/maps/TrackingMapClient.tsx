'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/browser'

// Dynamically import TrackingMap with ssr: false so it never runs on the server
const TrackingMap = dynamic(() => import('./TrackingMap'), { ssr: false })

export default function TrackingMapClient({ teams: initialTeams, checkpoints, eventId }: any) {
  const [teams, setTeams] = useState(initialTeams)
  const supabase = useMemo(() => createClient(), [])

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
    const channel = supabase.channel(`map-realtime-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runners' }, () => {
        fetchTeams()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runner_locations' }, () => {
        fetchTeams()
      })
      .subscribe()

    // Polling interval fallback (setiap 4 detik) untuk memastikan data selalu segar
    const interval = setInterval(fetchTeams, 4000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [eventId, supabase])

  return <TrackingMap teams={teams} checkpoints={checkpoints} />
}
