'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { MapPin } from 'lucide-react'

interface Incident {
  id: string
  type: string
  severity: string
  status: string
  description: string
  reported_at: string
  photo_url?: string | null
  latitude?: number | null
  longitude?: number | null
  runner?: { full_name: string }
  teams?: { team_code: string }
}

export default function IncidentListPublic({ incidents }: { incidents: Incident[] }) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  if (incidents.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">Tidak ada laporan/insiden.</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Runner / Team</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((inc) => (
            <TableRow key={inc.id}>
              <TableCell className="text-xs whitespace-nowrap">
                {new Date(inc.reported_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
              </TableCell>
              <TableCell>
                <div className="text-xs font-semibold">{inc?.runner?.full_name || '-'}</div>
                <div className="text-[10px] text-gray-500">{(inc?.teams as any)?.team_code}</div>
              </TableCell>
              <TableCell>
                <Badge variant={inc.status === 'open' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {inc.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setSelectedIncident(inc)}>
                  Lihat
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Insiden</DialogTitle>
            <DialogDescription>
              Dilaporkan pada {selectedIncident && new Date(selectedIncident.reported_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">Pelari</span>
                  <span className="font-semibold">{selectedIncident.runner?.full_name || '-'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">Tim</span>
                  <span className="font-semibold">{(selectedIncident.teams as any)?.team_code || '-'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">Tingkat</span>
                  <Badge variant={selectedIncident.severity === 'emergency' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">Jenis</span>
                  <span className="font-medium capitalize">{selectedIncident.type.replace('_', ' ')}</span>
                </div>
              </div>

              <div>
                <span className="block text-gray-500 text-xs mb-1">Deskripsi</span>
                <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedIncident.description}
                </div>
              </div>

              {selectedIncident.photo_url && (
                <div>
                  <span className="block text-gray-500 text-xs mb-1">Foto Lampiran</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIncident.photo_url.split(',').map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img 
                          src={url} 
                          alt="Incident attachment" 
                          className="w-full h-32 object-cover rounded-md border" 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedIncident.latitude && selectedIncident.longitude && (
                <div className="pt-2">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={() => {
                      // Navigate to the map location with ?lat=...&lng=...&incident=...
                      const url = new URL(window.location.href)
                      url.searchParams.set('lat', selectedIncident.latitude!.toString())
                      url.searchParams.set('lng', selectedIncident.longitude!.toString())
                      url.searchParams.set('incident', selectedIncident.id)
                      window.history.pushState({}, '', url.toString())
                      // Close dialog
                      setSelectedIncident(null)
                      // Scroll to top where map is
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Lihat Lokasi di Peta
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
