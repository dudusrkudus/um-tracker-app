import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveEvent, getCurrentProfile, hasRole } from '@/lib/auth'
import { STAFF_WRITE_ROLES } from '@/lib/validation/operations'
import { formatDateTime } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckpointEntryPanel } from '@/components/operations/checkpoint-entry-panel'
import type { CheckpointOption, TeamOption } from '@/components/operations/types'

type LogRow = {
  id: string
  arrived_at: string
  departed_at: string | null
  relay_changed: boolean
  notes: string | null
  teams: { team_code: string } | null
  checkpoints: { code: string; name: string; sequence_no: number } | null
  runner: { full_name: string; relay_order: number } | null
  next_runner: { full_name: string; relay_order: number } | null
  recorder: { full_name: string } | null
}

export default async function CheckpointLogsPage() {
  const [event, profile] = await Promise.all([getActiveEvent(), getCurrentProfile()])

  if (!event) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Checkpoint & Relay</h1>
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada event berstatus <strong>ready</strong> atau <strong>live</strong>.{' '}
          <Link href="/events" className="underline">Kelola event</Link>
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const [teamsRes, checkpointsRes, logsRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id, team_code, team_name, status, runners ( id, full_name, relay_order, status )')
      .eq('event_id', event.id)
      .order('team_code'),
    supabase
      .from('checkpoints')
      .select('id, code, name, sequence_no')
      .eq('event_id', event.id)
      .or('is_active.is.null,is_active.eq.true')
      .order('sequence_no'),
    supabase
      .from('checkpoint_logs')
      .select(
        `id, arrived_at, departed_at, relay_changed, notes,
         teams ( team_code ),
         checkpoints ( code, name, sequence_no ),
         runner:runners!checkpoint_logs_runner_id_fkey ( full_name, relay_order ),
         next_runner:runners!checkpoint_logs_next_runner_id_fkey ( full_name, relay_order ),
         recorder:profiles!checkpoint_logs_recorded_by_fkey ( full_name )`
      )
      .eq('event_id', event.id)
      .order('arrived_at', { ascending: false })
      .limit(50),
  ])

  const loadError = teamsRes.error ?? checkpointsRes.error ?? logsRes.error
  if (loadError) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">Gagal memuat data: {loadError.message}</div>
  }

  const logs = (logsRes.data ?? []) as unknown as LogRow[]
  const checkpoints = (checkpointsRes.data ?? []) as CheckpointOption[]

  // Highest checkpoint sequence logged per team, to suggest the next one
  const lastSeq = new Map<string, number>()
  const { data: seqRows } = await supabase
    .from('checkpoint_logs')
    .select('team_id, checkpoints ( sequence_no )')
    .eq('event_id', event.id)
  for (const row of (seqRows ?? []) as unknown as { team_id: string; checkpoints: { sequence_no: number } | null }[]) {
    const seq = row.checkpoints?.sequence_no ?? 0
    lastSeq.set(row.team_id, Math.max(lastSeq.get(row.team_id) ?? 0, seq))
  }

  const teams: TeamOption[] = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    team_code: t.team_code,
    team_name: t.team_name,
    status: t.status,
    runners: ((t.runners ?? []) as TeamOption['runners']).sort((a, b) => a.relay_order - b.relay_order),
    last_sequence: lastSeq.get(t.id) ?? null,
  }))

  const canWrite = hasRole(profile, STAFF_WRITE_ROLES)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Checkpoint & Relay</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{event.name}</p>
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Pencatatan cepat</CardTitle>
            <CardDescription>Waktu dalam WIB. Pilih tim untuk mengisi pelari & checkpoint berikutnya otomatis.</CardDescription>
          </CardHeader>
          <CardContent>
            {checkpoints.length === 0 || teams.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Tambahkan {teams.length === 0 ? <Link href="/teams" className="underline">tim</Link> : null}
                {teams.length === 0 && checkpoints.length === 0 ? ' dan ' : null}
                {checkpoints.length === 0 ? <Link href="/checkpoints" className="underline">checkpoint</Link> : null}{' '}
                terlebih dahulu.
              </p>
            ) : (
              <CheckpointEntryPanel teams={teams} checkpoints={checkpoints} />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log terbaru</CardTitle>
          <CardDescription>50 catatan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <ClipboardList className="h-8 w-8" aria-hidden />
              <p>Belum ada catatan checkpoint.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Tim</TableHead>
                    <TableHead>Checkpoint</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Pelari</TableHead>
                    <TableHead>Petugas</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(log.arrived_at)}
                        {log.departed_at && !log.relay_changed && (
                          <span className="block text-xs text-muted-foreground">
                            berangkat {formatDateTime(log.departed_at)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{log.teams?.team_code}</TableCell>
                      <TableCell>
                        {log.checkpoints ? `${log.checkpoints.code} — ${log.checkpoints.name}` : '-'}
                      </TableCell>
                      <TableCell>
                        {log.relay_changed ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">RELAY</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">CHECK-IN</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.runner ? `#${log.runner.relay_order} ${log.runner.full_name}` : '-'}
                        {log.relay_changed && log.next_runner && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" aria-label="digantikan oleh" />#{log.next_runner.relay_order}{' '}
                            {log.next_runner.full_name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{log.recorder?.full_name ?? '-'}</TableCell>
                      <TableCell className="max-w-48 truncate" title={log.notes ?? undefined}>
                        {log.notes ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
