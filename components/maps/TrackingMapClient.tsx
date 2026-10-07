'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/browser'

import { useRouter } from 'next/navigation'

// Dynamically import TrackingMap with ssr: false so it never runs on the server
const TrackingMap = dynamic(() => import('./TrackingMap'), { ssr: false })

export default function TrackingMapClient({ teams: initialTeams, checkpoints, eventId, teamIds }: any) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!eventId) return
    
    const fetchTeams = async () => {
      let query = supabase
        .from('teams')
        .select('id, team_code, status, last_known_latitude, last_known_longitude, last_location_at, runners ( full_name, relay_order, status )')
        .eq('event_id', eventId)
        
      if (teamIds && teamIds.length > 0) {
        query = query.in('id', teamIds)
      }

      const { data } = await query

      if (data) {
        setTeams(data)
      }
    }

    // Supabase Realtime Subscription
    const channel = supabase.channel(`map-realtime-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runners' }, () => {
        fetchTeams()
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runner_locations' }, () => {
        fetchTeams()
        router.refresh()
      })
      .subscribe()

    // Polling interval fallback (setiap 4 detik) untuk update data lokal map
    const interval = setInterval(fetchTeams, 4000)

    // Interval untuk refresh layar utuh (Server Component Table) secara berkala agar 'freshness' ikut terupdate walau tidak ada pergerakan
    const refreshInterval = setInterval(() => {
      router.refresh()
    }, 60000) // Setiap 1 menit

    return () => {
      clearInterval(interval)
      clearInterval(refreshInterval)
      supabase.removeChannel(channel)
    }
  }, [eventId, supabase, router])

  return <TrackingMap teams={teams} checkpoints={checkpoints} />
}
