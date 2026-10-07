import { createClient } from '@/lib/supabase/server'
import TrackingMapClient from '@/components/maps/TrackingMapClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, AlertTriangle, Clock, MapPin, TriangleAlert } from 'lucide-react'
import { notFound } from 'next/navigation'

// Helper to determine freshness
function getFreshnessBadge(lastLocationAt: string | null, staleWarning: number, staleCritical: number) {
  if (!lastLocationAt) {
    return { label: 'never', color: 'bg-gray-200 text-gray-800', icon: <MapPin className="w-3 h-3 mr-1" /> }
  }
  const minutesAgo = (new Date().getTime() - new Date(lastLocationAt).getTime()) / 60000
  if (minutesAgo <= staleWarning) {
    return { label: 'fresh', color: 'bg-green-100 text-green-800', icon: <Activity className="w-3 h-3 mr-1" /> }
  } else if (minutesAgo <= staleCritical) {
    return { label: 'warning', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" /> }
  } else {
    return { label: 'stale', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3 mr-1" /> }
  }
}

export default async function TeamPublicPage({ params }: { params: Promise<{ team_code: string }> }) {
  const resolvedParams = await params;
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
  const staleWarning = event?.stale_warning_minutes || 15
  const staleCritical = event?.stale_critical_minutes || 30

  // Fetch the specific Team
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      categories ( code ),
      runners ( full_name, relay_order, status )
    `)
    .eq('event_id', eventId || '')
    .ilike('team_code', `${resolvedParams.team_code}%`) // Match any team starting with this code

  if (!teams || teams.length === 0) {
    notFound() // Shows 404 if team doesn't exist
  }

  const teamIds = teams.map(t => t.id)

  // Use the first team's name for the header, or just uppercase the parameter if it's a prefix query
  const title = teams.length === 1 ? (teams[0].team_name || teams[0].team_code) : resolvedParams.team_code

  // Fetch checkpoints
  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('id, code, name, latitude, longitude')
    .eq('event_id', eventId || '')

  // Fetch active incidents for these teams
  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      id, type, severity, status, description, reported_at,
      runner:runners!incidents_runner_id_fkey ( full_name ),
      teams ( team_code )
    `)
    .in('team_id', teamIds)
    .order('reported_at', { ascending: false })

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">{title}</h1>
        <p className="text-sm text-slate-500">Live Tracker & Status {teams.length > 1 ? `(${teams.length} Tim)` : ''}</p>
      </div>

      {/* Map Section */}
      <Card>
        <CardContent className="p-0">
          <TrackingMapClient 
            teams={teams} // Pass matched teams
            teamIds={teamIds} // Ensure MapClient only fetches these teams
            checkpoints={checkpoints || []} 
            eventId={eventId}
          />
        </CardContent>
      </Card>

      {/* Team Status Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Status Pelari</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Runner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => {
                const freshness = getFreshnessBadge(
                  team.last_location_at,
                  staleWarning,
                  staleCritical
                )

                // Determine active runner
                const runners = team.runners || []
                const runningRunner = runners.filter((r: any) => r.status === 'running').sort((a: any, b: any) => a.relay_order - b.relay_order)[0]
                const nextRunner = runners.filter((r: any) => r.status === 'not_started').sort((a: any, b: any) => a.relay_order - b.relay_order)[0]
                const finishedRunner = runners.filter((r: any) => r.status === 'finished' || r.status === 'completed_leg').sort((a: any, b: any) => b.relay_order - a.relay_order)[0]

                let activeRunnerName = '-'
                if (runningRunner) {
                  activeRunnerName = runningRunner.full_name
                } else if (nextRunner && team.status === 'waiting_relay') {
                  activeRunnerName = `${nextRunner.full_name} (Waiting)`
                } else if (finishedRunner) {
                  activeRunnerName = `${finishedRunner.full_name} (Finished)`
                }

                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="font-bold text-xs">{activeRunnerName}</div>
                      <div className="text-[10px] text-gray-500">{team.team_code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] whitespace-nowrap">
                        {team.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${freshness.color}`}>
                        {freshness.icon}
                        {freshness.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {team.last_location_at
                        ? new Date(team.last_location_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta'
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incidents / Laporan Section */}
      {incidents && incidents.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="text-red-800 flex items-center">
              <TriangleAlert className="w-5 h-5 mr-2" />
              Laporan / Insiden
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pelari</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc: any) => (
                  <TableRow key={inc.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(inc.reported_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold">{inc.runner?.full_name || '-'}</div>
                      <div className="text-[10px] text-gray-500">{(inc.teams as any)?.team_code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inc.status === 'open' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {inc.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                      {inc.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
