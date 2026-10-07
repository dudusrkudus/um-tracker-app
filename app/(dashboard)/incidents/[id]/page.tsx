import Link from 'next/link'
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
  teams: {
    team_code: string
    team_name: string
    last_known_latitude?: number | null
    last_known_longitude?: number | null
  } | null
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
       teams ( team_code, team_name, last_known_latitude, last_known_longitude ),
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
                <span className="block text-muted-foreground mb-2">Lampiran File ({inc.photo_url.split(',').length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inc.photo_url.split(',').map((url, index) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.includes('image')
                    return (
                      <div key={index} className="rounded-md overflow-hidden border bg-slate-100 flex flex-col justify-center items-center">
                        {isImage ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Lampiran ${index + 1}`} className="w-full h-auto max-h-[400px] object-contain" />
                          </a>
                        ) : (
                          <div className="p-8 flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                              Buka Dokumen {index + 1}
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                  {(() => {
                    const lat = inc.latitude ?? inc.teams?.last_known_latitude ?? null
                    const lng = inc.longitude ?? inc.teams?.last_known_longitude ?? null
                    const isFromTeam = inc.latitude === null && inc.teams?.last_known_latitude != null

                    if (lat !== null && lng !== null) {
                      return (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-medium text-xs sm:text-sm text-foreground">
                              {lat.toFixed(6)}, {lng.toFixed(6)}
                            </span>
                            {isFromTeam && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Posisi Terakhir Tim
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <Link
                              href={`/map?lat=${lat}&lng=${lng}&incident=${inc.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                                <line x1="9" x2="9" y1="3" y2="18" />
                                <line x1="15" x2="15" y1="6" y2="21" />
                              </svg>
                              Buka di Live Map
                            </Link>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" x2="21" y1="14" y2="3" />
                              </svg>
                              Google Maps
                            </a>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span>-</span>
                        <span className="text-xs text-amber-600">(Koordinat GPS belum tersedia)</span>
                      </span>
                    )
                  })()}
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
