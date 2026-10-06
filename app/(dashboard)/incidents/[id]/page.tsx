import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/auth'
import { formatDateTime, humanize } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IncidentUpdateForm } from '@/components/operations/incident-update-form'
import { IncidentStatusBadge, SeverityBadge } from '@/components/operations/badges'
import type { ProfileOption } from '@/components/operations/types'

type IncidentDetail = {
  id: string
  type: string
  severity: string
  status: string
  description: string
  latitude: number | null
  longitude: number | null
  assigned_to: string | null
  resolution_notes: string | null
  reported_at: string
  resolved_at: string | null
  photo_url: string | null
  teams: { team_code: string; team_name: string } | null
  runner: { full_name: string } | null
  reporter: { full_name: string; role: string } | null
  assignee: { full_name: string } | null
}

export default async function IncidentDetailPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const incidentId = params.id
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()])

  const { data: incident, error } = await supabase
    .from('incidents')
    .select(
      `id, type, severity, status, description, latitude, longitude,
       assigned_to, resolution_notes, reported_at, resolved_at, photo_url,
       teams ( team_code, team_name ),
       runner:runners!incidents_runner_id_fkey ( full_name ),
       reporter:profiles!incidents_reported_by_fkey ( full_name, role ),
       assignee:profiles!incidents_assigned_to_fkey ( full_name )`
    )
    .eq('id', incidentId)
    .maybeSingle()

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">Error: {error.message}</div>
  }
  if (!incident) notFound()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('is_active', true)
    .in('role', ['admin', 'race_director', 'support_coordinator', 'marshal'])
    .order('full_name')

  const isManager = hasRole(profile, ['admin', 'race_director', 'support_coordinator'])
  const isPic = profile?.id === incident.assigned_to
  const canUpdate = isManager || isPic

  const inc = incident as unknown as IncidentDetail

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Detail Insiden</h1>
        <p className="text-muted-foreground font-mono text-sm">{inc.id}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Status</span>
              <div className="col-span-2"><IncidentStatusBadge status={inc.status} /></div>
              
              <span className="text-muted-foreground">Tingkat</span>
              <div className="col-span-2"><SeverityBadge severity={inc.severity} /></div>

              <span className="text-muted-foreground">Jenis</span>
              <div className="col-span-2 font-medium">{humanize(inc.type)}</div>

              <span className="text-muted-foreground">Waktu (WIB)</span>
              <div className="col-span-2">{formatDateTime(inc.reported_at)}</div>
              
              <span className="text-muted-foreground">Dilaporkan oleh</span>
              <div className="col-span-2">
                {inc.reporter ? `${inc.reporter.full_name} (${humanize(inc.reporter.role)})` : 'Sistem / Eksternal'}
              </div>
            </div>

            <div className="border-t pt-4">
              <span className="block text-muted-foreground mb-1">Deskripsi</span>
              <p className="whitespace-pre-wrap">{inc.description}</p>
            </div>
            
            {inc.photo_url && (
              <div className="border-t pt-4">
                <span className="block text-muted-foreground mb-2">Lampiran Foto</span>
                <div className="rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inc.photo_url} alt="Insiden" className="w-full h-auto max-h-[400px] object-contain bg-slate-100" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subjek & Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Tim</span>
                <div className="col-span-2 font-medium">
                  {inc.teams ? `${inc.teams.team_code} — ${inc.teams.team_name}` : '-'}
                </div>
                
                <span className="text-muted-foreground">Pelari</span>
                <div className="col-span-2">{inc.runner?.full_name ?? '-'}</div>

                <span className="text-muted-foreground">Lokasi</span>
                <div className="col-span-2">
                  {inc.latitude && inc.longitude ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${inc.latitude},${inc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {inc.latitude}, {inc.longitude}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Penyelesaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">PIC</span>
                <div className="col-span-2">{inc.assignee?.full_name ?? 'Belum ditugaskan'}</div>

                {inc.resolved_at && (
                  <>
                    <span className="text-muted-foreground">Waktu selesai</span>
                    <div className="col-span-2">{formatDateTime(inc.resolved_at)}</div>
                  </>
                )}
              </div>
              
              {inc.resolution_notes && (
                <div className="border-t pt-4">
                  <span className="block text-muted-foreground mb-1">Catatan penyelesaian</span>
                  <p className="whitespace-pre-wrap">{inc.resolution_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {canUpdate && (
        <Card className="border-indigo-200">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle>Update Insiden</CardTitle>
            <CardDescription>Ubah status dan tugaskan PIC.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <IncidentUpdateForm
              incident={{
                id: inc.id,
                status: inc.status,
                severity: inc.severity,
                assigned_to: inc.assigned_to,
                resolution_notes: inc.resolution_notes,
              }}
              profiles={(profiles ?? []) as ProfileOption[]}
              canAssign={isManager}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
