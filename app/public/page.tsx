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
import { Activity, AlertTriangle, Clock, MapPin } from 'lucide-react'

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

export default async function PublicCombinedPage() {
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

  // Fetch Teams
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      categories ( code ),
      runners ( full_name, relay_order, status )
    `)
    .eq('event_id', eventId || '')
    .order('last_location_at', { ascending: false, nullsFirst: false })

  const teamsData = teams || []

  // Fetch checkpoints
  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('id, code, name, latitude, longitude')
    .eq('event_id', eventId || '')

  return (
    <div className="space-y-6">
      
      {/* Map Section */}
      <Card>
        <CardContent className="p-0">
          <TrackingMapClient 
            teams={teamsData} 
            checkpoints={checkpoints || []} 
            eventId={eventId}
          />
        </CardContent>
      </Card>

      {/* Team Status Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Runner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsData.map((team) => {
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
                    <TableCell className="font-medium text-xs">{(team.categories as any)?.code}</TableCell>
                    <TableCell>
                      <div className="font-bold">{activeRunnerName}</div>
                      <div className="text-[10px] text-gray-500">{team.team_code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {team.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${freshness.color}`}>
                        {freshness.icon}
                        {freshness.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.last_location_at
                        ? new Date(team.last_location_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta'
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {team.last_location_source ? (
                        <span className="text-xs text-gray-500 uppercase">
                          {team.last_location_source}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {teamsData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    Belum ada tim aktif.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
