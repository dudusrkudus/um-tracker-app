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

  // Fetch all checkpoint logs for the teams
  const { data: logs } = await supabase
    .from('checkpoint_logs')
    .select(`
      arrived_at,
      departed_at,
      runner_id,
      team_id,
      runners ( full_name, relay_order, team_id ),
      teams ( team_code, team_name )
    `)
    .in('team_id', teamIds)
    .order('arrived_at', { ascending: true })

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Catatan Waktu Pelari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Belum ada catatan waktu.</p>
        </CardContent>
      </Card>
    )
  }

  // Group by runner
  const runnerStats: Record<string, {
    runnerName: string;
    teamCode: string;
    relayOrder: number;
    startTime: Date;
    endTime: Date;
  }> = {}

  let teamStartTime: Date | null = null
  let teamEndTime: Date | null = null

  logs.forEach((log: any) => {
    if (!log.runners || !log.runner_id) return

    const arrivedAt = new Date(log.arrived_at)
    // Team start/end
    if (!teamStartTime || arrivedAt < teamStartTime) teamStartTime = arrivedAt
    if (!teamEndTime || arrivedAt > teamEndTime) teamEndTime = arrivedAt

    // Runner start/end
    const rid = log.runner_id
    if (!runnerStats[rid]) {
      runnerStats[rid] = {
        runnerName: log.runners.full_name,
        teamCode: log.teams?.team_code || '-',
        relayOrder: log.runners.relay_order,
        startTime: arrivedAt,
        endTime: arrivedAt
      }
    } else {
      if (arrivedAt < runnerStats[rid].startTime) runnerStats[rid].startTime = arrivedAt
      if (arrivedAt > runnerStats[rid].endTime) runnerStats[rid].endTime = arrivedAt
    }
  })

  const runnerList = Object.values(runnerStats).sort((a, b) => {
    if (a.teamCode !== b.teamCode) return a.teamCode.localeCompare(b.teamCode)
    return a.relayOrder - b.relayOrder
  })

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
            {runnerList.map((r, i) => {
              const durationMs = r.endTime.getTime() - r.startTime.getTime()
              return (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-bold text-sm">{r.runnerName}</div>
                    <div className="text-[10px] text-gray-500">{r.teamCode} - Relay {r.relayOrder}</div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {r.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {r.endTime.getTime() === r.startTime.getTime() 
                      ? '-' 
                      : r.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {durationMs > 0 ? formatDuration(durationMs) : 'Sedang Berlari / Menunggu'}
                  </TableCell>
                </TableRow>
              )
            })}
            {runnerList.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-4">
                  Belum ada data pelari yang tercatat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
