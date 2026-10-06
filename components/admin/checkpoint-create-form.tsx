'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCheckpoint, updateCheckpoint } from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const initialState = { error: '', success: false }

export function CheckpointCreateForm({ events, checkpoint }: { events: any[]; checkpoint?: any }) {
  const router = useRouter()
  const isEdit = !!checkpoint
  const [state, formAction, isPending] = useActionState(
    (isEdit ? updateCheckpoint.bind(null, checkpoint.id) : createCheckpoint) as any,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      router.push('/checkpoints')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event_id">Event</Label>
          {isEdit ? (
            <>
              <input type="hidden" name="event_id" value={checkpoint.event_id} />
              <Input disabled value={events.find(e => e.id === checkpoint.event_id)?.name ?? ''} />
            </>
          ) : (
            <Select name="event_id" required>
              <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
              <SelectContent>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode Checkpoint</Label>
            <Input id="code" name="code" required placeholder="WS1" defaultValue={checkpoint?.code} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sequence_no">Urutan</Label>
            <Input id="sequence_no" name="sequence_no" type="number" required min="1" placeholder="1" defaultValue={checkpoint?.sequence_no} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Checkpoint</Label>
          <Input id="name" name="name" required placeholder="Water Station 1" defaultValue={checkpoint?.name} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" name="latitude" type="number" step="any" required placeholder="-6.200000" defaultValue={checkpoint?.latitude} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" name="longitude" type="number" step="any" required placeholder="106.816666" defaultValue={checkpoint?.longitude} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="geofence_radius_m">Radius Geofence (Meter)</Label>
            <Input id="geofence_radius_m" name="geofence_radius_m" type="number" required defaultValue={checkpoint?.geofence_radius_m ?? 100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distance_km">Jarak dari Start (KM)</Label>
            <Input id="distance_km" name="distance_km" type="number" step="0.1" defaultValue={checkpoint?.distance_km ?? undefined} />
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input type="hidden" name="is_active" value="false" />
            <input id="is_active" type="checkbox" name="is_active" value="true" defaultChecked={checkpoint.is_active} className="h-4 w-4" />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isEdit ? 'Simpan Perubahan' : 'Simpan Checkpoint'}
      </Button>
    </form>
  )
}
