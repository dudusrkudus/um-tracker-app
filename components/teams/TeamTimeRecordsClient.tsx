'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Timer, 
  TimerReset, 
  Footprints, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  MapPin 
} from 'lucide-react'

export interface RunnerLocationPoint {
  id: number
  recorded_at: string
  latitude: number
  longitude: number
  accuracy_m: number | null
  speed_kmh: number | null
}

export interface RunnerRecord {
  id: string
  runnerName: string
  teamCode: string
  relayOrder: number
  status: string
  startTime: string | null
  endTime: string | null
  locations: RunnerLocationPoint[]
}

export interface IntervalAuditPoint {
  pointIndex: number
  recordedAt: string
  timeStr: string
  deltaSeconds: number
  distanceM: number
  distanceKm: number
  speedKmh: number
  paceStr: string
  accuracyM: number | null
  latitude: number
  longitude: number
  isAnomaly: boolean // > 25 km/h
  isFast: boolean // 18 - 25 km/h
}

// Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDuration(ms: number) {
  if (ms < 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDelta(seconds: number): string {
  if (seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins === 0) return `+${secs} dtk`
  return `+${mins}m ${secs.toString().padStart(2, '0')}s`
}

function formatPace(speedKmh: number): string {
  if (speedKmh <= 0.2) return '-'
  const minutesPerKm = 60 / speedKmh
  if (minutesPerKm > 60) return '>60:00/km'
  const mins = Math.floor(minutesPerKm)
  const secs = Math.round((minutesPerKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}/km`
}

export function computeIntervalAudits(locs: RunnerLocationPoint[]): {
  intervals: IntervalAuditPoint[]
  totalDistanceKm: number
  avgSpeedKmh: number
  anomalyCount: number
} {
  if (!locs || locs.length === 0) {
    return { intervals: [], totalDistanceKm: 0, avgSpeedKmh: 0, anomalyCount: 0 }
  }

  // Sort ascending by time
  const sorted = [...locs].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
  
  const intervals: IntervalAuditPoint[] = []
  let totalDistanceKm = 0
  let anomalyCount = 0

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]
    const timeStr = new Date(cur.recorded_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    })

    if (i === 0) {
      intervals.push({
        pointIndex: 1,
        recordedAt: cur.recorded_at,
        timeStr,
        deltaSeconds: 0,
        distanceM: 0,
        distanceKm: 0,
        speedKmh: 0,
        paceStr: '-',
        accuracyM: cur.accuracy_m,
        latitude: cur.latitude,
        longitude: cur.longitude,
        isAnomaly: false,
        isFast: false
      })
      continue
    }

    const prev = sorted[i - 1]
    const distKm = calculateDistanceKm(prev.latitude, prev.longitude, cur.latitude, cur.longitude)
    const dtSeconds = (new Date(cur.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 1000

    let speedKmh = 0
    if (dtSeconds > 5) {
      speedKmh = distKm / (dtSeconds / 3600)
    }

    // Anomaly threshold: speed > 25 km/h in an interval (unlikely for sustained ultra marathon running)
    const isAnomaly = speedKmh > 25
    const isFast = speedKmh > 18 && speedKmh <= 25

    if (isAnomaly) anomalyCount++
    totalDistanceKm += distKm

    intervals.push({
      pointIndex: i + 1,
      recordedAt: cur.recorded_at,
      timeStr,
      deltaSeconds: dtSeconds,
      distanceM: Math.round(distKm * 1000),
      distanceKm: distKm,
      speedKmh,
      paceStr: formatPace(speedKmh),
      accuracyM: cur.accuracy_m,
      latitude: cur.latitude,
      longitude: cur.longitude,
      isAnomaly,
      isFast
    })
  }

  const totalTimeSeconds = sorted.length > 1
    ? (new Date(sorted[sorted.length - 1].recorded_at).getTime() - new Date(sorted[0].recorded_at).getTime()) / 1000
    : 0

  const avgSpeedKmh = totalTimeSeconds > 0 ? totalDistanceKm / (totalTimeSeconds / 3600) : 0

  return {
    intervals,
    totalDistanceKm,
    avgSpeedKmh,
    anomalyCount
  }
}

export default function TeamTimeRecordsClient({
  runners,
  teamTotalTimeMs
}: {
  runners: RunnerRecord[]
  teamTotalTimeMs: number
}) {
  const [selectedRunner, setSelectedRunner] = useState<RunnerRecord | null>(null)

  const selectedAudit = selectedRunner ? computeIntervalAudits(selectedRunner.locations) : null

  return (
    <>
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
                <TableHead className="text-center">Audit Integritas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runners.map((r, i) => {
                const hasStarted = r.startTime != null
                const isFinished = ['completed_leg', 'finished'].includes(r.status)
                const isRunning = r.status === 'running'
                
                const startD = r.startTime ? new Date(r.startTime) : null
                const endD = r.endTime ? new Date(r.endTime) : null
                const durationMs = (startD && endD) ? endD.getTime() - startD.getTime() : 0

                const audit = computeIntervalAudits(r.locations)
                const hasAnomaly = audit.anomalyCount > 0
                const hasLocations = r.locations && r.locations.length > 0

                return (
                  <TableRow key={r.id || i}>
                    <TableCell>
                      <div className="font-bold text-sm">{r.runnerName}</div>
                      <div className="text-[10px] text-gray-500">{r.teamCode} - Relay {r.relayOrder}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {hasStarted 
                        ? startD!.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
                        : <span className="text-gray-400 italic">Belum tercatat</span>}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {isFinished && endD && startD && endD.getTime() !== startD.getTime()
                        ? endD!.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {!hasStarted
                        ? (isRunning ? <span className="text-amber-600 font-semibold animate-pulse">Menunggu GPS...</span> : (isFinished ? 'Selesai (Tanpa Jejak)' : '-'))
                        : (isRunning
                            ? (durationMs > 0 
                                ? <span className="text-blue-600 font-semibold">{formatDuration(durationMs)} <span className="text-[10px] font-normal">(Berjalan)</span></span>
                                : <span className="text-blue-600 font-semibold animate-pulse">Sedang Berlari</span>)
                            : (durationMs > 0 
                                ? formatDuration(durationMs) 
                                : 'Selesai (Hanya 1 Jejak)'))}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {hasLocations ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRunner(r)}
                          className={`h-7 px-2.5 text-xs font-medium border shadow-xs transition-all ${
                            hasAnomaly 
                              ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' 
                              : 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {hasAnomaly ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-600" />
                              <span className="font-bold">⚠️ Anomali ({r.locations.length})</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                              <span>Log Jejak ({r.locations.length})</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {runners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-4">
                    Belum ada data aktivitas pelari yang tercatat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Dialog Detail Audit Interval Jejak */}
      {selectedRunner && selectedAudit && (
        <Dialog open={!!selectedRunner} onOpenChange={(open) => !open && setSelectedRunner(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-full ${selectedAudit.anomalyCount > 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedAudit.anomalyCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Audit Jejak & Integritas Kecepatan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {selectedRunner.runnerName} • {selectedRunner.teamCode} (Relay #{selectedRunner.relayOrder})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Status Banner */}
              {selectedAudit.anomalyCount > 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-xs">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Peringatan: Terdeteksi {selectedAudit.anomalyCount} Interval Tidak Wajar!</span>
                    Terdapat pergerakan dengan kecepatan rata-rata di atas 25 km/jam. Hal ini mengindikasikan kemungkinan pelari menggunakan kendaraan bermotor atau terjadi lonjakan GPS.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3 text-green-800 text-xs">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Pola Pergerakan Normal & Wajar</span>
                    Semua titik interval waktu berada dalam batas kecepatan lari manusia normal (&lt; 18 km/jam).
                  </div>
                </div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Total Titik</div>
                  <div className="text-base font-bold text-slate-800">{selectedAudit.intervals.length} titik</div>
                </div>
                <div className="p-2.5 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Jarak Jejak</div>
                  <div className="text-base font-bold text-blue-700">{selectedAudit.totalDistanceKm.toFixed(2)} km</div>
                </div>
                <div className="p-2.5 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Rata-rata Speed</div>
                  <div className="text-base font-bold text-slate-800">{selectedAudit.avgSpeedKmh.toFixed(1)} km/h</div>
                </div>
                <div className="p-2.5 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Rata-rata Pace</div>
                  <div className="text-base font-bold text-slate-800">{formatPace(selectedAudit.avgSpeedKmh)}</div>
                </div>
              </div>

              {/* Table of Interval Points */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Log Rekaman Posisi Setiap Interval</span>
                  <span className="text-[10px] font-normal text-slate-500">Frekuensi update otomatis ~5 menit</span>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 shadow-xs">
                      <TableRow>
                        <TableHead className="w-10 text-center text-[11px]">#</TableHead>
                        <TableHead className="text-[11px]">Waktu (WIB)</TableHead>
                        <TableHead className="text-[11px]">Interval</TableHead>
                        <TableHead className="text-[11px]">Jarak</TableHead>
                        <TableHead className="text-[11px]">Kecepatan (Pace)</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-center text-[11px]">Peta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAudit.intervals.map((pt) => (
                        <TableRow key={pt.pointIndex} className={pt.isAnomaly ? 'bg-red-50/60' : ''}>
                          <TableCell className="text-center text-xs font-mono text-slate-500">
                            {pt.pointIndex}
                          </TableCell>
                          <TableCell className="text-xs font-medium whitespace-nowrap">
                            {pt.timeStr}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {pt.pointIndex === 1 ? 'Start' : formatDelta(pt.deltaSeconds)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap font-mono">
                            {pt.pointIndex === 1 
                              ? '-' 
                              : pt.distanceM >= 1000 
                                ? `${(pt.distanceM / 1000).toFixed(2)} km` 
                                : `${pt.distanceM} m`}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap font-mono">
                            {pt.pointIndex === 1 ? (
                              '-'
                            ) : (
                              <div>
                                <span className={pt.isAnomaly ? 'font-bold text-red-600' : 'text-slate-700'}>
                                  {pt.speedKmh.toFixed(1)} km/h
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {pt.paceStr}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {pt.pointIndex === 1 ? (
                              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                                Titik Awal
                              </Badge>
                            ) : pt.isAnomaly ? (
                              <Badge className="bg-red-600 text-white text-[10px]">
                                ⚠️ Kendaraan?
                              </Badge>
                            ) : pt.isFast ? (
                              <Badge className="bg-amber-500 text-white text-[10px]">
                                Sprint/Cepat
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[10px]">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <a
                              href={`https://www.google.com/maps?q=${pt.latitude},${pt.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-[11px] hover:underline"
                              title="Buka titik di Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Reference notes */}
              <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border space-y-1">
                <div className="font-semibold text-slate-600">Panduan Indikator Integritas:</div>
                <div>• <strong>🟢 Normal (&lt; 18 km/jam):</strong> Kecepatan lari atau jalan standar manusia di ultra marathon (Pace 3:20 s/d 10:00+ /km).</div>
                <div>• <strong>🟡 Sprint (18 - 25 km/jam):</strong> Lari sangat kencang dalam waktu singkat.</div>
                <div>• <strong>🔴 ⚠️ Dugaan Kendaraan (&gt; 25 km/jam):</strong> Berpindah jarak jauh dalam waktu singkat yang tidak realistis untuk lari jarak jauh berkelanjutan.</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
