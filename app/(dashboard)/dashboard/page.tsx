import { createClient } from '@/lib/supabase/server'
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
import { Activity, AlertTriangle, CheckCircle, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { IncidentStatusBadge, SeverityBadge } from '@/components/operations/badges'

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

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get active event (assuming the first live or ready one for MVP)
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

  // Fetch Open Incidents with details
  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      id, type, severity, status, description, reported_at,
      teams ( team_code, team_name ),
      runner:runners!incidents_runner_id_fkey ( full_name )
    `)
    .eq('event_id', eventId || '')
    .in('status', ['open', 'in_progress'])
    .order('reported_at', { ascending: false })

  const teamsData = teams || []
  const totalTeams = teamsData.length
  const runningTeams = teamsData.filter((t) => t.status === 'running').length
  const finishedTeams = teamsData.filter((t) => t.status === 'finished').length
  const openIncidentsCount = incidents?.length || 0

  // Calculate stale teams
  const staleTeamsCount = teamsData.filter((t) => {
    if (!t.last_location_at) return false
    const mins = (new Date().getTime() - new Date(t.last_location_at).getTime()) / 60000
    return mins > staleWarning
  }).length

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900">Race Control Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500">{event?.name || 'No active event'}</p>
        </div>
      </div>

      {/* Summary Stat Bar (Ultra-Compact on Mobile, Rich on Desktop) */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {/* Total Teams */}
        <div className="bg-white rounded-lg border border-gray-200/90 py-1.5 px-1 sm:py-3 sm:px-3 flex flex-col items-center justify-center text-center shadow-2xs">
          <div className="flex items-center gap-1 text-gray-900">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            <span className="text-sm sm:text-xl font-bold">{totalTeams}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate w-full">
            <span className="hidden sm:inline">Total </span>Teams
          </span>
        </div>

        {/* Running */}
        <div className="bg-white rounded-lg border border-blue-100 py-1.5 px-1 sm:py-3 sm:px-3 flex flex-col items-center justify-center text-center shadow-2xs bg-blue-50/20">
          <div className="flex items-center gap-1 text-blue-600">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
            <span className="text-sm sm:text-xl font-bold">{runningTeams}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-blue-600/80 font-medium mt-0.5 truncate w-full">
            Running
          </span>
        </div>

        {/* Finished */}
        <div className="bg-white rounded-lg border border-green-100 py-1.5 px-1 sm:py-3 sm:px-3 flex flex-col items-center justify-center text-center shadow-2xs bg-green-50/20">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
            <span className="text-sm sm:text-xl font-bold">{finishedTeams}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-green-600/80 font-medium mt-0.5 truncate w-full">
            <span className="sm:hidden">Finish</span>
            <span className="hidden sm:inline">Finished</span>
          </span>
        </div>

        {/* Stale */}
        <div className="bg-white rounded-lg border border-yellow-100 py-1.5 px-1 sm:py-3 sm:px-3 flex flex-col items-center justify-center text-center shadow-2xs bg-yellow-50/20">
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
            <span className="text-sm sm:text-xl font-bold">{staleTeamsCount}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-yellow-700/80 font-medium mt-0.5 truncate w-full">
            Stale<span className="hidden sm:inline"> &gt;{staleWarning}m</span>
          </span>
        </div>

        {/* Incidents */}
        <div className={`rounded-lg border py-1.5 px-1 sm:py-3 sm:px-3 flex flex-col items-center justify-center text-center shadow-2xs transition-colors ${
          openIncidentsCount > 0
            ? 'bg-red-50/80 border-red-200 text-red-700'
            : 'bg-white border-gray-200/90 text-gray-900'
        }`}>
          <div className="flex items-center gap-1">
            <AlertTriangle className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 ${openIncidentsCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-sm sm:text-xl font-bold ${openIncidentsCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{openIncidentsCount}</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-medium mt-0.5 truncate w-full ${openIncidentsCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            Insiden
          </span>
        </div>
      </div>

      {/* Operational Tables */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Incidents Table */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50/50 p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm sm:text-base text-red-800">Insiden Aktif</CardTitle>
              <Link href="/incidents">
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-white">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents?.map((inc: any) => (
                    <TableRow key={inc.id} className="hover:bg-slate-50">
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(inc.reported_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{inc.teams?.team_code || 'Unknown'}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                          {inc.runner?.full_name || 'Tim'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <SeverityBadge severity={inc.severity} />
                          <IncidentStatusBadge status={inc.status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/incidents/${inc.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!incidents || incidents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Tidak ada insiden aktif.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team Status Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
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
                        <TableCell className="font-medium text-xs whitespace-nowrap">{(team.categories as any)?.code}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs whitespace-nowrap">{activeRunnerName}</div>
                          <div className="text-[10px] text-gray-500">{team.team_code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px] whitespace-nowrap">
                            {team.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${freshness.color}`}>
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
                        <TableCell>
                          {team.last_location_source ? (
                            <span className="text-[11px] text-gray-500 uppercase whitespace-nowrap">
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
                        No teams found for the active event.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
