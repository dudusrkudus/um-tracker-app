'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const initialState = { error: '', success: false }

export function EventCreateForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createEvent as any, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/events')
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
          <Label htmlFor="name">Nama Event</Label>
          <Input id="name" name="name" required placeholder="UM Tracking 2026" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">Tanggal</Label>
            <Input id="event_date" name="event_date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue="Asia/Jakarta" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status Awal</Label>
          <Select name="status" defaultValue="draft">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stale_warning_minutes">Warning Time (Menit)</Label>
            <Input id="stale_warning_minutes" name="stale_warning_minutes" type="number" defaultValue="15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stale_critical_minutes">Critical Time (Menit)</Label>
            <Input id="stale_critical_minutes" name="stale_critical_minutes" type="number" defaultValue="30" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Simpan Event
      </Button>
    </form>
  )
}
