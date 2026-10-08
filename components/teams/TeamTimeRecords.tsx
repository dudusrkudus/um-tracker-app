import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Timer, TimerReset } from 'lucide-react'

// Helper to format duration in HH:mm:ss
function formatDuration(ms: number) {
  if (ms < 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default async function TeamTimeRecords({ teamIds }: { teamIds: string[] }) {
  const supabase = await createClient()

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

  // 3. Fetch runner locations
  const { data: locs } = await supabase
    .from('runner_locations')
    .select('runner_id, recorded_at')
    .in('team_id', teamIds)

  // 4. Calculate stats per runner
  const runnerStats: Record<string, {
    id: string;
    runnerName: string;
    teamCode: string;
    relayOrder: number;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
  }> = {}

  runners.forEach((r: any) => {
    runnerStats[r.id] = {
      id: r.id,
      runnerName: r.full_name,
      teamCode: r.teams?.team_code || '-',
      relayOrder: r.relay_order,
      status: r.status,
      startTime: null,
      endTime: null
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
    if (!rs.startTime || time < rs.startTime) rs.startTime = time
    if (!rs.endTime || time > rs.endTime) rs.endTime = time
  }

  if (logs) logs.forEach((l: any) => processTime(l.runner_id, l.arrived_at))
  if (locs) locs.forEach((l: any) => processTime(l.runner_id, l.recorded_at))

  const runnerList = Object.values(runnerStats).sort((a, b) => {
    if (a.teamCode !== b.teamCode) return a.teamCode.localeCompare(b.teamCode)
    return a.relayOrder - b.relayOrder
  })

  // Filter out runners that haven't started at all AND don't have times
  const activeRunners = runnerList.filter(r => r.startTime || r.status !== 'not_started')

  const teamTotalTimeMs = (teamEndTime && teamStartTime) ? (teamEndTime as Date).getTime() - (teamStartTime as Date).getTime() : 0

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-800 flex items-center justify-between">
          <div className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Catatan Waktu Pelari
          </div>
          <div className="flex items-center text-sm font-bold bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-700 shadow-sm">
            <TimerReset className="w-4 h-4 mr-2" />
            Total Waktu Tim: {teamTotalTimeMs > 0 ? formatDuration(teamTotalTimeMs) : '-'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelari</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead className="text-right">Durasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeRunners.map((r, i) => {
              const hasStarted = r.startTime != null
              const isSameTime = r.startTime && r.endTime && r.startTime.getTime() === r.endTime.getTime()
              const durationMs = (r.startTime && r.endTime) ? r.endTime.getTime() - r.startTime.getTime() : 0
              
              return (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-bold text-sm">{r.runnerName}</div>
                    <div className="text-[10px] text-gray-500">{r.teamCode} - Relay {r.relayOrder}</div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {hasStarted 
                      ? r.startTime!.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
                      : <span className="text-gray-400 italic">Belum tercatat</span>}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {!hasStarted || isSameTime
                      ? '-' 
                      : r.endTime!.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {!hasStarted
                      ? (r.status === 'running' ? <span className="text-amber-600">Menunggu GPS...</span> : (['completed_leg', 'finished'].includes(r.status) ? 'Selesai (Tanpa Jejak)' : '-'))
                      : (durationMs > 0 
                          ? formatDuration(durationMs) 
                          : (['completed_leg', 'finished'].includes(r.status) ? 'Selesai (Hanya 1 Jejak)' : 'Sedang Berlari'))}
                  </TableCell>
                </TableRow>
              )
            })}
            {activeRunners.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-4">
                  Belum ada data aktivitas pelari yang tercatat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
