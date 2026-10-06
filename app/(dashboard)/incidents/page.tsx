import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveEvent, getCurrentProfile, hasRole } from '@/lib/auth'
import { STAFF_WRITE_ROLES } from '@/lib/validation/operations'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IncidentCreateForm } from '@/components/operations/incident-create-form'
import { IncidentStatusBadge, SeverityBadge } from '@/components/operations/badges'
import type { ProfileOption, TeamOption } from '@/components/operations/types'

type IncidentRow = {
  id: string
  type: string
  severity: string
  status: string
  description: string
  reported_at: string
  teams: { team_code: string; team_name: string } | null
  runner: { full_name: string } | null
  assignee: { full_name: string } | null
}

export default async function IncidentsPage() {
  const [event, profile] = await Promise.all([getActiveEvent(), getCurrentProfile()])

  if (!event) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Insiden</h1>
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada event berstatus <strong>ready</strong> atau <strong>live</strong>.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const [incidentsRes, teamsRes, profilesRes] = await Promise.all([
    supabase
      .from('incidents')
      .select(
        `id, type, severity, status, description, reported_at,
         teams ( team_code, team_name ),
         runner:runners!incidents_runner_id_fkey ( full_name ),
         assignee:profiles!incidents_assigned_to_fkey ( full_name )`
      )
      .eq('event_id', event.id)
      .order('reported_at', { ascending: false }),
    supabase
      .from('teams')
      .select('id, team_code, team_name, status, runners ( id, full_name, relay_order, status )')
      .eq('event_id', event.id)
      .order('team_code'),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .in('role', ['admin', 'race_director', 'support_coordinator', 'marshal'])
      .order('full_name'),
  ])

  const loadError = incidentsRes.error ?? teamsRes.error ?? profilesRes.error
  if (loadError) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">Gagal memuat data: {loadError.message}</div>
  }

  const incidents = (incidentsRes.data ?? []) as unknown as IncidentRow[]
  const teams: TeamOption[] = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    team_code: t.team_code,
    team_name: t.team_name,
    status: t.status,
    runners: ((t.runners ?? []) as TeamOption['runners']).sort((a, b) => a.relay_order - b.relay_order),
    last_sequence: null,
  }))
  const profileOptions = (profilesRes.data ?? []) as ProfileOption[]

  const canWrite = hasRole(profile, STAFF_WRITE_ROLES)
  const canAssign = hasRole(profile, ['admin', 'race_director', 'support_coordinator'])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Insiden</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Laporkan insiden baru</CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentCreateForm eventId={event.id} teams={teams} profiles={profileOptions} canAssign={canAssign} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar insiden</CardTitle>
          <CardDescription>Semua laporan pada event ini</CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada insiden yang dilaporkan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Waktu (WIB)</TableHead>
                    <TableHead>Tim / Pelari</TableHead>
                    <TableHead>Tingkat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="font-mono text-xs" title={inc.id}>{inc.id.split('-')[0]}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(inc.reported_at)}</TableCell>
                      <TableCell>
                        {inc.teams ? (
                          <>
                            <div className="font-semibold">{inc.teams.team_code}</div>
                            {inc.runner && <div className="text-xs text-muted-foreground">{inc.runner.full_name}</div>}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell><SeverityBadge severity={inc.severity} /></TableCell>
                      <TableCell><IncidentStatusBadge status={inc.status} /></TableCell>
                      <TableCell>{inc.assignee?.full_name ?? '-'}</TableCell>
                      <TableCell>
                        <Link href={`/incidents/${inc.id}`}>
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </Link>
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
