import { createAdminClient } from '@/lib/supabase/admin'
import TeamTimeRecordsClient, { RunnerRecord } from './TeamTimeRecordsClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Timer } from 'lucide-react'

export default async function TeamTimeRecords({ teamIds }: { teamIds: string[] }) {
  const supabase = createAdminClient()

  // 1. Fetch all runners for these teams
  const { data: runners } = await supabase
    .from('runners')
    .select('id, full_name, relay_order, team_id, status, teams(team_code, team_name)')
    .in('team_id', teamIds)

  if (!runners || runners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Catatan Waktu Pelari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Belum ada pelari di tim ini.</p>
        </CardContent>
      </Card>
    )
  }

  // 2. Fetch checkpoint logs
  const { data: logs } = await supabase
    .from('checkpoint_logs')
    .select('runner_id, arrived_at')
    .in('team_id', teamIds)

  // 3. Fetch runner locations (with coordinates, speed, and accuracy)
  const { data: locs } = await supabase
    .from('runner_locations')
    .select('id, runner_id, recorded_at, latitude, longitude, accuracy_m, speed_kmh')
    .in('team_id', teamIds)
    .order('recorded_at', { ascending: true })

  // 4. Calculate stats per runner
  const runnerStats: Record<string, RunnerRecord> = {}

  runners.forEach((r: any) => {
    runnerStats[r.id] = {
      id: r.id,
      runnerName: r.full_name,
      teamCode: r.teams?.team_code || '-',
      relayOrder: r.relay_order,
      status: r.status,
      startTime: null,
      endTime: null,
      locations: []
    }
  })

  let teamStartTime: Date | null = null
  let teamEndTime: Date | null = null

  const processTime = (runnerId: string, timeStr: string) => {
    if (!runnerStats[runnerId]) return
    const time = new Date(timeStr)
    
    // Update team boundaries
    if (!teamStartTime || time < teamStartTime) teamStartTime = time
    if (!teamEndTime || time > teamEndTime) teamEndTime = time

    // Update runner boundaries
    const rs = runnerStats[runnerId]
    if (!rs.startTime || time < new Date(rs.startTime)) rs.startTime = time.toISOString()
    if (!rs.endTime || time > new Date(rs.endTime)) rs.endTime = time.toISOString()
  }

  if (logs) logs.forEach((l: any) => processTime(l.runner_id, l.arrived_at))
  if (locs) {
    locs.forEach((l: any) => {
      processTime(l.runner_id, l.recorded_at)
      if (runnerStats[l.runner_id]) {
        runnerStats[l.runner_id].locations.push({
          id: l.id,
          recorded_at: l.recorded_at,
          latitude: l.latitude,
          longitude: l.longitude,
          accuracy_m: l.accuracy_m,
          speed_kmh: l.speed_kmh
        })
      }
    })
  }

  const runnerList = Object.values(runnerStats).sort((a, b) => {
    if (a.teamCode !== b.teamCode) return a.teamCode.localeCompare(b.teamCode)
    return a.relayOrder - b.relayOrder
  })

  // Filter out runners that haven't started at all AND don't have times
  const activeRunners = runnerList.filter(r => r.startTime || r.status !== 'not_started')

  const teamTotalTimeMs = (teamEndTime && teamStartTime) ? (teamEndTime as Date).getTime() - (teamStartTime as Date).getTime() : 0

  return (
    <TeamTimeRecordsClient 
      runners={activeRunners}
      teamTotalTimeMs={teamTotalTimeMs}
    />
  )
}
